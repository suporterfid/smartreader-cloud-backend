// src/devices/devices.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DevicesService } from './devices.service';
import { DevicesController } from './devices.controller';
import { Device, DeviceSchema } from './schemas/device.schema';
import { MqttModule } from '../mqtt/mqtt.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: Device.name, schema: DeviceSchema }]), 
  MqttModule],
  providers: [DevicesService],
  controllers: [DevicesController],
  exports: [DevicesService]
})
export class DevicesModule {}
