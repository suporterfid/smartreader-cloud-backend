import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SystemMetricsDocument = SystemMetrics & Document;

@Schema({ timestamps: true, collection: 'systemMetrics' })
export class SystemMetrics {
  @Prop({ required: true })
  cpuLoad: number; // CPU Load Percentage

  @Prop({ required: true })
  memoryUsage: number; // Memory Usage in MB

  @Prop({ required: true })
  uptime: number; // System Uptime in seconds

  @Prop({ type: Date, default: Date.now })
  timestamp: Date; // Timestamp for historical tracking

}
export const SystemMetricsSchema = SchemaFactory.createForClass(SystemMetrics);
SystemMetricsSchema.index({ timestamp: -1 }); // Index for historical queries
