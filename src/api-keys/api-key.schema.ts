// src/api-keys/api-key.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ApiKeyDocument = ApiKey & Document;

@Schema({ collection: 'apikeys', timestamps: true })
export class ApiKey {
    @Prop({ required: true, unique: true })
    key: string;

    @Prop({ required: true })
    description: string;

    @Prop({ default: true })
    active: boolean;
}


export const ApiKeySchema = SchemaFactory.createForClass(ApiKey);
