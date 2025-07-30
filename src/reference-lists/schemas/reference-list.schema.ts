import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ReferenceListDocument = ReferenceList & Document;

@Schema({ timestamps: true })
export class ReferenceList {
  @Prop({ required: true, unique: true })
  referenceListId: number;

  @Prop({ type: Object, required: true })
  referenceList: Record<string, any>;

  @Prop({ type: Array, default: [] })
  results: any[];
}

export const ReferenceListSchema = SchemaFactory.createForClass(ReferenceList);
ReferenceListSchema.index({ referenceListId: 1 });
