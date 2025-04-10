import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

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
  status: string; // Ex: pending, processing, success, error, timed-out

  @Prop({ type: Object })
  response?: any; // Response data, if available

  @Prop({ enum: ['low', 'medium', 'high'], default: 'medium' })
  priority: string; // Command execution priority
  
  @Prop({ type: Date, default: null })
  executeAt?: Date; // Scheduled execution timestamp

  @Prop({ type: Date })
  executedAt?: Date; // When the command was actually executed

  @Prop()
  group_command_id?: string; // Reference to group command if part of a batch

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'DeviceGroup' })
  deviceGroup?: MongooseSchema.Types.ObjectId; // Reference to device group
}

export const CommandSchema = SchemaFactory.createForClass(Command);