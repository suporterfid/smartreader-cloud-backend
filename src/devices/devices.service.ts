// src\devices\devices.service.ts
import { Injectable, NotFoundException, BadRequestException, Logger   } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Device, DeviceDocument } from './schemas/device.schema';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class DevicesService {

  private readonly logger = new Logger(DevicesService.name);
  
  constructor(@InjectModel(Device.name) private deviceModel: Model<DeviceDocument>) {}

  async createDevice(deviceData: Partial<Device>): Promise<Device> {
    const deviceSerial = deviceData.deviceSerial || uuidv4();  // Auto-generate if not provided
    const device = new this.deviceModel({ ...deviceData, deviceSerial });
    return device.save();
  }

  async getAllDevices(): Promise<Device[]> {
    return this.deviceModel.find().exec();
  }

  async getDeviceById(deviceId: string): Promise<Device | null> {
    return this.deviceModel.findById(deviceId).exec();
  }

  async updateDevice(deviceId: string, updateData: Partial<Device>): Promise<Device | null> {
    try {
      // Prevent updating deviceSerial if it's included in updateData
      if (updateData.deviceSerial) {
        delete updateData.deviceSerial;
      }

      const device = await this.deviceModel.findByIdAndUpdate(
        deviceId, 
        updateData, 
        { new: true, runValidators: true }
      ).exec();

      if (!device) {
        this.logger.warn(`Device with ID ${deviceId} not found for update`);
        return null;
      }

      return device;
    } catch (error) {
      this.logger.error(`Error updating device with ID ${deviceId}: ${error.message}`, error.stack);
      if (error.name === 'ValidationError') {
        throw new BadRequestException(`Invalid device data: ${error.message}`);
      }
      throw error;
    }
  }

  async deleteDevice(deviceId: string): Promise<Device | null> {
    try {
      const device = await this.deviceModel.findByIdAndDelete(deviceId).exec();
      if (!device) {
        this.logger.warn(`Device with ID ${deviceId} not found for deletion`);
        return null;
      }
      return device;
    } catch (error) {
      this.logger.error(`Error deleting device with ID ${deviceId}: ${error.message}`, error.stack);
      throw error;
    }
  }


  async updateFirmwareVersion(deviceSerial: string, firmwareVersion: string): Promise<Device> {
    if (!firmwareVersion) throw new BadRequestException('Firmware version is required');
      const device = await this.deviceModel.findOne({ deviceSerial });
      if (!device) throw new NotFoundException('Device not found');
      device.firmwareVersion = firmwareVersion;
    await device.save();
      return device;
  }

  async updateDeviceConfiguration(
    deviceSerial: string,
    configUpdate: Partial<{ networkSettings: any; ledControl: any; operationalMode: string }>
  ): Promise<Device> {
    const device = await this.deviceModel.findOne({ deviceSerial });
      if (!device) throw new NotFoundException('Device not found');
      if (configUpdate.networkSettings) {
      device.networkSettings = { ...device.networkSettings, ...configUpdate.networkSettings };
    }
      if (configUpdate.ledControl) {
      device.ledControl = { ...device.ledControl, ...configUpdate.ledControl };
    }
      if (configUpdate.operationalMode) {
      device.operationalMode = configUpdate.operationalMode;
    }
      await device.save();
    return device;
  }
}
