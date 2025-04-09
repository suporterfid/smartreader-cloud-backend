import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { FirmwareCategory } from './firmware-category.schema';

export type FirmwareDocument = Firmware & Document;

@Schema({ timestamps: true, collection: 'firmwares' })
export class Firmware {
  @Prop({ required: true })
  fileName: string;

  @Prop({ required: true })
  version: string;

  @Prop({ default: Date.now })
  uploadDate: Date;

  @Prop({ default: Date.now })
  lastUpdateDate: Date;

  @Prop({ required: true })
  fileSize: number;

  @Prop()
  description: string;

  @Prop({ default: [] })
  compatibleDeviceTypes: string[];

  @Prop()
  filePath: string; // Path to the stored file (can be local or S3 URL)

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'FirmwareCategory' }] })
  categories: FirmwareCategory[];

  @Prop({ default: true })
  active: boolean;
}

export const FirmwareSchema = SchemaFactory.createForClass(Firmware);
