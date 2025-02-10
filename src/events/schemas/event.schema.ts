import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type EventDocument = Event & Document;

@Schema({ timestamps: true, collection: 'events' })
export class Event {
  @Prop({ required: true })
  eventType: string;

  @Prop({ required: true, type: MongooseSchema.Types.Mixed })
  payload: any;
}

export const EventSchema = SchemaFactory.createForClass(Event);
