import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type DeviceGroupDocument = DeviceGroup & Document;

@Schema({ timestamps: true, collection: 'deviceGroups' })
export class DeviceGroup {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Device' }] })
  devices: MongooseSchema.Types.ObjectId[];

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ default: true })
  active: boolean;
  
  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const DeviceGroupSchema = SchemaFactory.createForClass(DeviceGroup);
