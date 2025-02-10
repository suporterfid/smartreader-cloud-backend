// src/commands/schemas/command.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CommandDocument = Command & Document;

@Schema({ timestamps: true, collection: 'deviceCommands' })
export class Command {
  @Prop({ required: true })
  commandId: string; // Identificador único do comando

  @Prop({ required: true })
  type: string; // "control" ou "management"

  @Prop({ required: true })
  deviceSerial: string; // Serial do dispositivo associado

  @Prop({ type: Object, required: true })
  payload: any;

  @Prop({ default: 'pending' })
  status: string; // Ex: pending, success, error

  @Prop({ type: Object })
  response?: any; // Dados da resposta, se houver
}

export const CommandSchema = SchemaFactory.createForClass(Command);
