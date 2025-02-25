import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
export type ApiKeyDocument = ApiKey & Document;

@Schema({ timestamps: true, collection: 'apiKeys' })
export class ApiKey {
  @Prop({ required: true, unique: true })
  key: string; // Unique API key

  @Prop({ required: true })
  description: string; // Description of the API Key usage

  @Prop({ required: true, enum: ['admin', 'operator', 'viewer'], default: 'viewer' })
  role: string; // Role associated with the API Key
  
  @Prop({ default: true })
  active: boolean; // Flag to enable/disable API key
}

export const ApiKeySchema = SchemaFactory.createForClass(ApiKey);
