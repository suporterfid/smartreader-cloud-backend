import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
export type CommandDocument = Command & Document;

@Schema({ timestamps: true, collection: 'deviceCommands' })
export class Command {
  @Prop({ required: true })
  command_id: string; // Unique command identifier

  @Prop({ required: true })
  type: string; // "control" or "management"

  @Prop({ required: true })
  deviceSerial: string; // Associated device serial number

  @Prop({ type: Object, required: true })
  payload: any;

  @Prop({ default: 'pending' })
  status: string; // Ex: pending, success, error

  @Prop({ type: Object })
  response?: any; // Response data, if available

  @Prop({ enum: ['low', 'medium', 'high'], default: 'medium' })
  priority: string; // Command execution priority
  
  @Prop({ type: Date, default: null })
  executeAt?: Date; // Scheduled execution timestamp
}

export const CommandSchema = SchemaFactory.createForClass(Command);
