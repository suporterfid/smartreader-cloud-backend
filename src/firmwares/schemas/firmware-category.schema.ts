import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type FirmwareCategoryDocument = FirmwareCategory & Document;

@Schema({ timestamps: true, collection: 'firmwareCategories' })
export class FirmwareCategory {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ default: true })
  active: boolean;
}

export const FirmwareCategorySchema = SchemaFactory.createForClass(FirmwareCategory);
