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
private readonly eventBuffer: any[] = [];
private readonly BATCH_SIZE = 10;
private readonly BATCH_INTERVAL_MS = 5000;

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
  this.eventBuffer.push(payload);
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

  let processedResponse: any = { response, message };

  // Dynamically process any payload data
  if (commandPayload && typeof commandPayload === 'object') {
    processedResponse.payload = { ...commandPayload };
    this.logger.log(`Processed payload data for command "${command}": ${JSON.stringify(processedResponse.payload)}`);
  }

  // Update the command response in database
  await this.commandsService.updateCommand(command_id, { status: response, response: processedResponse });
  await this.commandsService.updateCommandStatus(command_id, response, processedResponse);

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
  if (!command.commandId) command.commandId = uuidv4();
  command.deviceSerial = deviceSerial;
  this.commandsService.createCommand({
    commandId: command.commandId,
    type: 'control',
    deviceSerial: deviceSerial,
    payload: command,
    status: 'pending',
  }).catch((err) => this.logger.error('Error saving command', err));
  const topic = this.topics.controlPublish.replace('{deviceSerial}', deviceSerial);
  const payload = JSON.stringify(command);
  this.client.publish(topic, payload, { qos: 1, retain: false }, (err) => {
    if (err) {
      this.logger.error('Error publishing control command', err);
      this.commandsService.updateCommand(command.commandId, { status: 'error' })
        .catch((e) => this.logger.error('Error updating command status', e));
    } else {
      this.logger.log(`Control command published to "${topic}": ${payload}`);
    }
  });
}

publishManagementCommand(deviceSerial: string, command: any): void {
  if (!command.commandId) command.commandId = uuidv4();
  command.deviceSerial = deviceSerial;
  this.commandsService.createCommand({
    commandId: command.commandId,
    type: 'management',
    deviceSerial: deviceSerial,
    payload: command,
    status: 'pending',
  }).catch((err) => this.logger.error('Error saving command', err));
  const topic = this.topics.managementPublish.replace('{deviceSerial}', deviceSerial);
  const payload = JSON.stringify(command);
  this.client.publish(topic, payload, { qos: 1, retain: false }, (err) => {
    if (err) {
      this.logger.error('Error publishing management command', err);
      this.commandsService.updateCommand(command.commandId, { status: 'error' })
        .catch((e) => this.logger.error('Error updating command status', e));
    } else {
      this.logger.log(`Management command published to "${topic}": ${payload}`);
    }
  });
}

}
