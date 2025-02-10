import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { connect, MqttClient } from 'mqtt';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventsService } from '../events/events.service';
import { CommandsService } from '../commands/commands.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MqttService implements OnModuleInit {
  private client: MqttClient;
  private readonly logger = new Logger(MqttService.name);
  private readonly brokerUrl = process.env.MQTT_URL || 'mqtt://localhost:1883';

  private readonly topics = {
    events: process.env.TOPIC_EVENTS || 'smartreader/+/events',
    controlResponse: process.env.TOPIC_COMMAND_CONTROL_RESPONSE || 'smartreader/+/command/control/response',
    managementResponse: process.env.TOPIC_COMMAND_MANAGEMENT_RESPONSE || 'smartreader/+/command/management/response',
    controlPublish: process.env.TOPIC_COMMAND_CONTROL_PUBLISH || 'smartreader/{deviceSerial}/command/control',
    managementPublish: process.env.TOPIC_COMMAND_MANAGEMENT_PUBLISH || 'smartreader/{deviceSerial}/command/management'
  };

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly eventsService: EventsService,
    private readonly commandsService: CommandsService,
  ) {}

  onModuleInit() {
    this.client = connect(this.brokerUrl);

    this.client.on('connect', () => {
      this.logger.log(`Connected to MQTT broker at ${this.brokerUrl}`);

      this.client.subscribe(
        {
          [this.topics.events]: { qos: 0, rap: false },
          [this.topics.controlResponse]: { qos: 0, rap: false },
          [this.topics.managementResponse]: { qos: 0, rap: false }
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
      const msg = message.toString();
      this.logger.log(`Message received on topic "${topic}": ${msg}`);
      try {
        const payload = JSON.parse(msg);
        const parts = topic.split('/');
        const deviceSerial = parts[1];

        const expectedTopic = topic.replace(deviceSerial, '+');
        this.logger.log(`Analyzing matches for "${expectedTopic}"`);
        if (expectedTopic === this.topics.events) {
          payload.deviceSerial = deviceSerial;
          this.handleEventPayload(payload, deviceSerial);
        } else if (expectedTopic === this.topics.controlResponse || expectedTopic === this.topics.managementResponse) {
          payload.deviceSerial = deviceSerial;
          const { commandId, status, response } = payload;
          if (commandId) {
            await this.commandsService.updateCommand(commandId, { status, response });
          }
          this.eventEmitter.emit('mqtt.commandResponse', payload);
        } else {
          this.logger.log(`Topic "${topic}" is not managed currently. No matches for ${expectedTopic}`);
        }

      } catch (error) {
        this.logger.error('Error processing MQTT message', error);
      }
    });

    this.client.on('error', (error) => {
      this.logger.error('MQTT error', error);
    });
  }

  publishControlCommand(deviceSerial: string, command: any): void {
    if (!command.commandId) {
      command.commandId = uuidv4();
    }
    command.deviceSerial = deviceSerial;
    this.commandsService
      .createCommand({
        commandId: command.commandId,
        type: 'control',
        deviceSerial: deviceSerial,
        payload: command,
        status: 'pending',
      })
      .catch((err) => this.logger.error('Error saving command to the database', err));

    const topic = this.topics.controlPublish.replace('{deviceSerial}', deviceSerial);
    const payload = JSON.stringify(command);
    this.client.publish(topic, payload, { qos: 1, retain: false }, (err) => {
      if (err) {
        this.logger.error('Error publishing control command', err);
        this.commandsService
          .updateCommand(command.commandId, { status: 'error' })
          .catch((e) => this.logger.error('Error updating command status', e));
      } else {
        this.logger.log(`Control command published to "${topic}": ${payload}`);
      }
    });
  }

  publishManagementCommand(deviceSerial: string, command: any): void {
    if (!command.commandId) {
      command.commandId = uuidv4();
    }
    command.deviceSerial = deviceSerial;
    this.commandsService
      .createCommand({
        commandId: command.commandId,
        type: 'management',
        deviceSerial: deviceSerial,
        payload: command,
        status: 'pending',
      })
      .catch((err) => this.logger.error('Error saving command to the database', err));

    const topic = this.topics.managementPublish.replace('{deviceSerial}', deviceSerial);
    const payload = JSON.stringify(command);
    this.client.publish(topic, payload, { retain: false }, (err) => {
      if (err) {
        this.logger.error('Error publishing management command', err);
        this.commandsService
          .updateCommand(command.commandId, { status: 'error' })
          .catch((e) => this.logger.error('Error updating command status', e));
      } else {
        this.logger.log(`Management command published to "${topic}": ${payload}`);
      }
    });
  }

  private async handleEventPayload(payload: any, deviceSerial: string) {
    this.logger.log(`Processing event ${payload} detected for device ${deviceSerial}`);
    // Determine the event type
    if (payload['smartreader-mqtt-status']) {
      // Handle connectivity events
      if (payload['smartreader-mqtt-status'] === 'connected') {
        payload.eventType = 'connected';
        this.logger.log(`Device ${deviceSerial} connected.`);
      } else if (payload['smartreader-mqtt-status'] === 'disconnected') {
        payload.eventType = 'disconnected';
        this.logger.log(`Device ${deviceSerial} disconnected.`);
      }
    } else if (payload.tag_reads?.length === 1 && payload.tag_reads[0].epc === '*****') {
      // Handle heartbeat events
      payload.eventType = 'heartbeat';
      this.logger.log(`Heartbeat event detected for device ${deviceSerial}`);
    } else if (payload.tag_reads?.length > 0) {
      // Handle heartbeat events
      payload.eventType = 'tag_read';
      this.logger.log(`Tag Event event detected for device ${deviceSerial}`);
    } else if (payload.eventType === 'status') {
      // Handle device status events
      payload.eventType = 'status';
      this.logger.log(`Status event detected for device ${deviceSerial}`);
    } else if (payload.status && ['running', 'idle', 'armed'].includes(payload.status.toLowerCase())) {
      // Handle inventory status events
      payload.eventType = `inventory_status.${payload.status.toLowerCase()}`;
      this.logger.log(`Inventory status '${payload.status}' detected for device ${deviceSerial}`);
    } else if (payload.eventType === 'gpi-status') {
      // Handle GPI status events
      payload.eventType = 'gpi-status';
      this.logger.log(`GPI status event detected for device ${deviceSerial}`);
      payload.gpiData = payload.gpiConfigurations || [];
    } else {
      // Handle tag read events
      payload.eventType = 'status';
      this.logger.log(`Generic event detected for device ${deviceSerial}`);
    }
    this.logger.log(`Final eventType: ${payload.eventType}`);
    await this.eventsService.storeEvent(payload);
    this.eventEmitter.emit('mqtt.event', payload);
  }
}
