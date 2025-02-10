// src/devices/schemas/device.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DeviceDocument = Device & Document;

@Schema({ timestamps: true, collection: 'devices' })
export class Device {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  type: string; // e.g., sensor, reader, etc.

  @Prop({ required: true, unique: true })
  deviceSerial: string;

  @Prop()
  location: string;

  @Prop({ default: true })
  active: boolean;
}

export const DeviceSchema = SchemaFactory.createForClass(Device);
