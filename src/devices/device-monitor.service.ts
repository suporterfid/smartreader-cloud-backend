// src/devices/device-monitor.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DevicesService } from './devices.service';

@Injectable()
export class DeviceMonitorService {
  private readonly logger = new Logger(DeviceMonitorService.name);

  constructor(private readonly devicesService: DevicesService) {}

  // Run every minute to check device communication status
  @Cron('0 * * * * *')
  async handleDeviceCommunicationCheck() {
    this.logger.debug('Checking device communication status...');
    try {
      await this.devicesService.updateCommunicationStatus();
    } catch (error) {
      this.logger.error(`Error during device communication check: ${error.message}`, error.stack);
    }
  }
}
