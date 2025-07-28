// src/mqtt/mqtt.service.ts (partial update)
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { connect, MqttClient } from 'mqtt';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventsService } from '../events/events.service';
import { CommandsService } from '../commands/commands.service';
import { DevicesService } from '../devices/devices.service'; // Import DevicesService
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MqttService implements OnModuleInit {
  private client: MqttClient;
  private readonly logger = new Logger(MqttService.name);
  //private readonly brokerUrl = process.env.MQTT_URL || 'mqtt://localhost:1883';
  private readonly brokerUrl = 'mqtt://localhost:1883';
  private readonly eventBuffer: any[] = [];
  private readonly BATCH_SIZE = 10;
  private readonly BATCH_INTERVAL_MS = 5000;
  private readonly COMMAND_TIMEOUT_MS = 30000; // 30 seconds timeout
  private readonly pendingCommands = new Map<string, NodeJS.Timeout>();

  private readonly topics = {
    events: process.env.TOPIC_EVENTS || 'smartreader/+/events',
    controlResponse: process.env.TOPIC_COMMAND_CONTROL_RESPONSE || 'smartreader/+/command/control/response',
    managementResponse: process.env.TOPIC_COMMAND_MANAGEMENT_RESPONSE || 'smartreader/+/command/management/response',
    controlPublish: process.env.TOPIC_COMMAND_CONTROL_PUBLISH || 'smartreader/{deviceSerial}/command/control',
    managementPublish: process.env.TOPIC_COMMAND_MANAGEMENT_PUBLISH || 'smartreader/{deviceSerial}/command/management',
  };

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly eventsService: EventsService,
    private readonly commandsService: CommandsService,
    private readonly devicesService: DevicesService, // Inject DevicesService
  ) {
    setInterval(() => this.flushEventBuffer(), this.BATCH_INTERVAL_MS);
  }

  onModuleInit() {
    this.client = connect(this.brokerUrl);
    this.client.on('connect', () => {
      this.logger.log(`Connected to MQTT broker at ${this.brokerUrl}`);
      this.client.subscribe(
        {
          [this.topics.events]: { qos: 1 },
          [this.topics.controlResponse]: { qos: 1 },
          [this.topics.managementResponse]: { qos: 1 },
        },
        (err) => {
          if (err) {
            this.logger.error('Error subscribing to topics', err);
          } else {
            this.logger.log(`Subscribed to topics: ${Object.values(this.topics).join(', ')}`);
          }
        }
      );
    });

    this.client.on('message', async (topic: string, message: Buffer) => {
      try {
        const msg = message.toString();
        this.logger.log(`Received MQTT message on "${topic}": ${msg}`);
        const payload = JSON.parse(msg);
        const parts = topic.split('/');
        const deviceSerial = parts[1];

        // Update the lastSeen timestamp for the device
        if (deviceSerial) {
          await this.devicesService.updateLastSeen(deviceSerial);
        }
        
        if (topic.includes('events')) {
          payload.deviceSerial = deviceSerial;
          this.handleEventPayload(payload);
        } else if (topic.includes('command/control/response') || topic.includes('command/management/response')) {
          payload.deviceSerial = deviceSerial;
          await this.handleCommandResponse(deviceSerial, payload);
        }
      } catch (error) {
        this.logger.error('Error processing MQTT message', error);
      }
    });

    this.client.on('error', (error) => {
      this.logger.error('MQTT error', error);
    });
  }

  private async handleEventPayload(payload: any) {
    this.logger.log(`Buffering event: ${JSON.stringify(payload)}`);

    // New tag read event format
    if (payload.tag_reads && Array.isArray(payload.tag_reads)) {
      payload.tag_reads.forEach((tag: any) => {
        const event = {
          eventType: 'tagRead',
          deviceSerial: payload.deviceSerial || payload.readerName,
          timestamp: tag.firstSeenTimestamp
            ? new Date(Math.floor(tag.firstSeenTimestamp / 1000))
            : new Date(),
          payload: {
            epc: tag.epc,
            antenna: tag.antennaPort,
            rssi: tag.peakRssi,
            antennaZone: tag.antennaZone,
            txPower: tag.txPower,
            tagDataKey: tag.tagDataKey,
            tagDataKeyName: tag.tagDataKeyName,
            tagDataSerial: tag.tagDataSerial,
            deviceSerial: payload.deviceSerial || payload.readerName,
          },
        };
        this.eventBuffer.push(event);
      });
    } else if (payload.eventType === 'status' && payload.component === 'smartreader') {
      const deviceSerial = payload.deviceSerial || payload.SerialNumber || payload.readerName;
      const event = {
        eventType: 'status',
        deviceSerial,
        timestamp: payload.timestamp ? new Date(payload.timestamp) : new Date(),
        payload: { ...payload, deviceSerial },
      };
      this.eventBuffer.push(event);
    } else if (payload['smartreader-mqtt-status']) {
      const deviceSerial = payload.deviceSerial || payload.readerName;
      const event = {
        eventType: 'mqttConnection',
        deviceSerial,
        timestamp: new Date(),
        payload: { ...payload, deviceSerial },
      };
      this.eventBuffer.push(event);
    } else if (
      typeof payload.status === 'string' &&
      ['running', 'idle', 'iddle'].includes(payload.status.toLowerCase())
    ) {
      const deviceSerial = payload.deviceSerial || payload.readerName;
      const event = {
        eventType: 'inventoryStatus',
        deviceSerial,
        timestamp: new Date(),
        payload: { ...payload, deviceSerial },
      };
      this.eventBuffer.push(event);
    } else if (Array.isArray(payload)) {
      payload.forEach((event: any) => this.eventBuffer.push(event));
    } else {
      this.eventBuffer.push(payload);
    }

    if (this.eventBuffer.length >= this.BATCH_SIZE) {
      await this.flushEventBuffer();
    }
  }

  private async handleCommandResponse(deviceSerial: string, payload: any): Promise<void> {
    payload.deviceSerial = deviceSerial;
    const { command, command_id, response, message, payload: commandPayload } = payload;

    if (!command_id) {
      this.logger.warn(`Received command response without command_id for device: ${deviceSerial}`);
      return;
    }

    this.logger.log(`Received command response for ${command_id}: ${response}`);

    // Clear timeout tracking for the received command
    if (this.pendingCommands.has(command_id)) {
      clearTimeout(this.pendingCommands.get(command_id)!);
      this.pendingCommands.delete(command_id);
    }

    let processedResponse: any = { response, message };

    // Process dynamic payload data
    if (commandPayload && typeof commandPayload === 'object') {
      processedResponse.payload = { ...commandPayload };
      this.logger.log(`Processed payload data for command "${command}": ${JSON.stringify(processedResponse.payload)}`);
    }

    // Determine status based on response content
    let status = 'unknown';
    if (typeof response === 'string') {
      if (response.toLowerCase() === 'success') {
        status = 'completed';
      } else if (response.toLowerCase() === 'error' || response.toLowerCase() === 'failed') {
        status = 'failed';
      } else if (response.toLowerCase() === 'pending') {
        status = 'pending';
      }
    }

    this.logger.log(`Updating command status for ${command_id}: ${status}`);

    // Update command response in database
    await this.commandsService.updateCommand(command_id, { status, response: processedResponse });
    await this.commandsService.updateCommandStatus(command_id, status, processedResponse);

    // Emit event with processed response
    this.eventEmitter.emit('mqtt.commandResponse', { ...payload, response: processedResponse });
  }

  private async flushEventBuffer() {
    if (this.eventBuffer.length === 0) return;
    try {
      await this.eventsService.storeEventsBulk(this.eventBuffer);
      this.logger.log(`Successfully stored ${this.eventBuffer.length} events.`);
      this.eventBuffer.length = 0;
    } catch (error) {
      this.logger.error(`Error storing events in bulk: ${error.message}`);
    }
  }

  publishControlCommand(deviceSerial: string, command: any): void {
    this.publishCommand(deviceSerial, command, 'control', this.topics.controlPublish);
  }

  publishManagementCommand(deviceSerial: string, command: any): void {
    this.publishCommand(deviceSerial, command, 'management', this.topics.managementPublish);
  }

  private publishCommand(deviceSerial: string, command: any, type: 'control' | 'management', topicTemplate: string): void {
    if (!command.command_id && !command.commandId) {
      command.command_id = uuidv4();
    } else if (command.commandId && !command.command_id) {
      command.command_id = command.commandId;
    }
    
    command.deviceSerial = deviceSerial;

    // Ensure the structure follows the expected format for the device
    if (command.command === 'mode' && command.payload) {
      // Ensure all required fields are included even if not specified by the user
      const modePayload = command.payload;
      
      // Set default values if not provided
      if (!modePayload.type) modePayload.type = 'INVENTORY';
      if (!modePayload.antennas) modePayload.antennas = [1, 2];
      if (!modePayload.antennaZone) modePayload.antennaZone = 'CABINET';
      if (!modePayload.transmitPower && modePayload.transmitPower !== 0) modePayload.transmitPower = 17.25;
    }

    this.commandsService.createCommand({
      command_id: command.command_id,
      type,
      deviceSerial,
      payload: command,
      status: 'pending',
    }).catch((err) => this.logger.error('Error saving command', err));

    const topic = topicTemplate.replace('{deviceSerial}', deviceSerial);
    const payload = JSON.stringify(command);

    this.client.publish(topic, payload, { qos: 1, retain: false }, (err) => {
      if (err) {
        this.logger.error(`Error publishing ${type} command`, err);
        this.commandsService.updateCommand(command.command_id, { status: 'error' })
          .catch((e) => this.logger.error('Error updating command status', e));
      } else {
        this.logger.log(`${type.charAt(0).toUpperCase() + type.slice(1)} command published to "${topic}": ${payload}`);

        // Set timeout to mark command as "timed-out" if no response is received
        const timeout = setTimeout(async () => {
          this.logger.warn(`Command ${command.command_id} has timed out.`);
          await this.commandsService.updateCommand(command.command_id, { status: 'timed-out' });
          await this.commandsService.updateCommandStatus(command.command_id, 'timed-out');
          this.pendingCommands.delete(command.command_id);
        }, this.COMMAND_TIMEOUT_MS);

        this.pendingCommands.set(command.command_id, timeout);
      }
    });
  }
}
