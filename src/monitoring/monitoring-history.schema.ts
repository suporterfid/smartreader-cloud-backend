// src/monitoring/monitoring-history.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MonitoringHistoryDocument = MonitoringHistory & Document;

@Schema({ timestamps: true, collection: 'monitoringHistory' })
export class MonitoringHistory {
  @Prop({ required: true })
  deviceSerial: string;

  @Prop({ required: true })
  lastCommunication: Date; // Data/hora do último evento (comunicação) recebido

  @Prop({ required: true })
  checkTimestamp: Date; // Data/hora em que a checagem foi realizada
}

export const MonitoringHistorySchema = SchemaFactory.createForClass(MonitoringHistory);
