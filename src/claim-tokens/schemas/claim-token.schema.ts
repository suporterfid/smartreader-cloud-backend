// src\claim-tokens\schemas\claim-token.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export type ClaimTokenDocument = ClaimToken & Document;

@Schema({ timestamps: true, collection: 'claimTokens' })
export class ClaimToken {
  @Prop({ required: true, unique: true, default: () => uuidv4() })
  token: string;

  @Prop({ required: true, enum: ['pending', 'claimed', 'expired'], default: 'pending' })
  status: string;

  @Prop({ required: true, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) })
  expiresAt: Date;

  @Prop()
  deviceSerial?: string;

  @Prop({ default: null })
  claimedAt?: Date;
}
export const ClaimTokenSchema = SchemaFactory.createForClass(ClaimToken);
ClaimTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
