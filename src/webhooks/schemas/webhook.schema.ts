// rc/webhooks/schemas/webhook.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
export type WebhookDocument = Webhook & Document;

@Schema({ timestamps: true })
export class Webhook {
  @Prop({ required: true, unique: true })
  url: string;
  @Prop({ required: true })
  eventType: string;
  @Prop({ required: true, enum: ['active', 'disabled'], default: 'active' })
  status: string;
  @Prop({ default: null })
  secret?: string;
}
export const WebhookSchema = SchemaFactory.createForClass(Webhook);
