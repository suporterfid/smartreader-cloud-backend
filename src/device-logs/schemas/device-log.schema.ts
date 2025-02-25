import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DeviceLogDocument = DeviceLog & Document;

@Schema({ timestamps: true, collection: 'deviceLogs' })
export class DeviceLog {
  @Prop({ required: true })
  deviceSerial: string; // Identifies the device

  @Prop({ required: true, enum: ['info', 'warning', 'error'], default: 'info' })
  severity: string; // Log severity level

  @Prop({ required: true })
  message: string; // Log message details

  @Prop({ type: Object })
  metadata?: Record<string, any>; // Optional metadata (JSON format)
  
  @Prop({ type: Date, default: Date.now })
  timestamp: Date; // Log timestamp
}
export const DeviceLogSchema = SchemaFactory.createForClass(DeviceLog);
DeviceLogSchema.index({ deviceSerial: 1, timestamp: -1 }); // Index for efficient querying
