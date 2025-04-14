// src/provisioning/schemas/provisioning-template.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProvisioningTemplateDocument = ProvisioningTemplate & Document;

@Schema({ timestamps: true })
export class ProvisioningTemplate {
  @Prop({ required: true, unique: true })
  name: string;
  
  @Prop({ required: true })
  description: string;
  
  @Prop({
    type: {
      host: { type: String, required: true },
      port: { type: Number, required: true },
      useTLS: { type: Boolean, default: true },
      topicPermissions: {
        type: [{
          topic: { type: String, required: true },
          permission: { type: String, enum: ['subscribe', 'publish', 'both'], required: true }
        }],
        default: []
      }
    },
    required: true
  })
  mqttConfig: {
    host: string;
    port: number;
    useTLS: boolean;
    topicPermissions: {
      topic: string;
      permission: string;
    }[];
  };
  
  @Prop({ type: Object, default: {} })
  parameters: Record<string, any>;
  
  @Prop({ default: true })
  isDefault: boolean;
  
  @Prop({ default: true })
  active: boolean;
}

export const ProvisioningTemplateSchema = SchemaFactory.createForClass(ProvisioningTemplate);
