// src/mqtt/mqtt.controller.ts
import { Controller, Post, Body, Param, Logger } from '@nestjs/common';
import { MqttService } from './mqtt.service';
import { ApiTags, ApiOperation, ApiParam, ApiBody, ApiResponse, ApiSecurity } from '@nestjs/swagger';

@ApiTags('MQTT')
@ApiSecurity('x-api-key')
@Controller('mqtt/:deviceSerial')
export class MqttController {

  private readonly logger = new Logger(MqttController.name);

  constructor(private readonly mqttService: MqttService) {}

  @Post('control')
  @ApiOperation({ summary: 'Send control command to the device' })
  @ApiParam({ name: 'deviceSerial', description: 'Device serial', example: 'ABC123' })
  @ApiBody({ description: 'Control command payload', type: Object })
  @ApiResponse({ status: 201, description: 'Control command sent successfully.' })
  async sendControlCommand(
    @Param('deviceSerial') deviceSerial: string,
    @Body() command: any
  ) {
    this.logger.log(`Sending control command to device: ${deviceSerial}`);
    await this.mqttService.publishControlCommand(deviceSerial, command);
    this.logger.log(`Control command sent: ${JSON.stringify(command)}`);
    return { message: 'Control command sent successfully', deviceSerial, command };
  }

  @Post('management')
  @ApiOperation({ summary: 'Send management command to the device' })
  @ApiParam({ name: 'deviceSerial', description: 'Device serial', example: 'ABC123' })
  @ApiBody({ description: 'Management command payload', type: Object })
  @ApiResponse({ status: 201, description: 'Management command sent successfully.' })
  async sendManagementCommand(
    @Param('deviceSerial') deviceSerial: string,
    @Body() command: any,
  ) {
    this.logger.log(`Sending management command to device: ${deviceSerial}`);
    await this.mqttService.publishManagementCommand(deviceSerial, command);
    this.logger.log(`Management command sent: ${JSON.stringify(command)}`);
    return { message: 'Management command sent successfully', deviceSerial, command };
  }
}

