// src\devices\devices.controller.ts
import { Controller, Patch, Post, Get, Put, Delete, Param, Body, Logger } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { MqttService } from '../mqtt/mqtt.service';
import { ApiTags, ApiOperation, ApiParam, ApiResponse, ApiSecurity } from '@nestjs/swagger';

@ApiTags('Devices')
@ApiSecurity('x-api-key')
@Controller('api/devices')
export class DevicesController {
  private readonly logger = new Logger(DevicesController.name);

  constructor(
    private readonly devicesService: DevicesService,
    private readonly mqttService: MqttService
  ) {}

  @Post(':deviceSerial/control')
  @ApiOperation({ summary: 'Send control command to a device' })
  async sendControlCommand(
    @Param('deviceSerial') deviceSerial: string,
    @Body() command: any
  ) {
    this.logger.log(`Sending control command to device: ${deviceSerial}`);
    await this.mqttService.publishControlCommand(deviceSerial, command);
    this.logger.log(`Control command sent: ${JSON.stringify(command)}`);
    return { message: 'Control command sent successfully', deviceSerial, command };
  }

  @Post()
  @ApiOperation({ summary: 'Register a new device' })
  async createDevice(@Body() deviceData: any) {
    this.logger.log(`Registering a new device: ${JSON.stringify(deviceData)}`);
    const device = await this.devicesService.createDevice(deviceData);
    this.logger.log(`Device registered successfully: ${device.deviceSerial}`);
    return {
      message: 'Device registered successfully',
      deviceSerial: device.deviceSerial,
      device
    };
  }

  @Get()
  @ApiOperation({ summary: 'List all devices' })
  async getAllDevices() {
    this.logger.log('Fetching all devices...');
    const devices = await this.devicesService.getAllDevices();
    this.logger.log(`Retrieved ${devices.length} device(s)`);
    return devices;
  }

  @Put(':deviceId')
  @ApiOperation({ summary: 'Update device information' })
  async updateDevice(@Param('deviceId') deviceId: string, @Body() updateData: any) {
    this.logger.log(`Updating device with ID: ${deviceId}`);
    const updatedDevice = await this.devicesService.updateDevice(deviceId, updateData);
    this.logger.log(`Device updated: ${JSON.stringify(updatedDevice)}`);
    return updatedDevice;
  }

  @Delete(':deviceId')
  @ApiOperation({ summary: 'Delete a device' })
  async deleteDevice(@Param('deviceId') deviceId: string) {
    this.logger.log(`Deleting device with ID: ${deviceId}`);
    const result = await this.devicesService.deleteDevice(deviceId);
    this.logger.log(`Device deleted: ${deviceId}`);
    return result;
  }

  @Patch(':deviceSerial/firmware')
  async updateFirmwareVersion(
    @Param('deviceSerial') deviceSerial: string,
    @Body('firmwareVersion') firmwareVersion: string,
  ) {
    return this.devicesService.updateFirmwareVersion(deviceSerial, firmwareVersion);
  }

  @Patch(':deviceSerial/configuration')
  async updateDeviceConfiguration(
    @Param('deviceSerial') deviceSerial: string,
    @Body() configUpdate: Partial<{ networkSettings: any; ledControl: any; operationalMode: string }>
  ) {
    return this.devicesService.updateDeviceConfiguration(deviceSerial, configUpdate);
  }
}
