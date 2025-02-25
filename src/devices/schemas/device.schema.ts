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
  
  @Prop({ default: null })
  lastSeen?: Date;

  @Prop({ default: null })
  firmwareVersion?: string;

  @Prop({
    type: {
      wifiSSID: { type: String, default: null },
      wifiPassword: { type: String, default: null },
      ethernetIP: { type: String, default: null },
    },
    default: {},
  })

  networkSettings: Record<string, any>;
    @Prop({
    type: {
      powerState: { type: Boolean, default: true },
      brightness: { type: Number, min: 0, max: 100, default: 50 },
    },
    default: {},
  })
  
  ledControl: Record<string, any>;
    @Prop({ enum: ['normal', 'low-power', 'debug'], default: 'normal' })
  operationalMode: string;
  
}

export const DeviceSchema = SchemaFactory.createForClass(Device);
