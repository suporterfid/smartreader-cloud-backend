// src\events\schemas\event.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
export type EventDocument = Event & Document;
@Schema({ timestamps: true })
export class Event {
  @Prop({ required: true })
  eventType: string;
  @Prop({ required: true })
  deviceSerial: string;
  @Prop({ type: Date, required: true })
  timestamp: Date;
  @Prop({ type: Object })
  payload: Record<string, any>;
}

export const EventSchema = SchemaFactory.createForClass(Event);

