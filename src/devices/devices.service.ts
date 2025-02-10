import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Device, DeviceDocument } from './schemas/device.schema';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class DevicesService {
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
    return this.deviceModel.findByIdAndUpdate(deviceId, updateData, { new: true }).exec();
  }

  async deleteDevice(deviceId: string): Promise<Device | null> {
    return this.deviceModel.findByIdAndDelete(deviceId).exec();
  }
}
