// src/certificates/schemas/certificate.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type CertificateDocument = Certificate & Document;

export enum CertificateStatus {
  ACTIVE = 'active',
  REVOKED = 'revoked',
  EXPIRED = 'expired'
}

@Schema({ timestamps: true })
export class Certificate {
  @Prop({ required: true })
  deviceSerial: string;
  
  @Prop({ required: true })
  pem: string;
  
  @Prop()
  privateKey?: string;
  
  @Prop({ 
    required: true, 
    enum: Object.values(CertificateStatus), 
    default: CertificateStatus.ACTIVE 
  })
  status: string;
  
  @Prop({ required: true })
  validFrom: Date;
  
  @Prop({ required: true })
  validTo: Date;
  
  @Prop()
  revokedAt?: Date;
  
  @Prop()
  commonName: string;
  
  @Prop()
  fingerprint: string;
  
  @Prop()
  serialNumber: string;
}

export const CertificateSchema = SchemaFactory.createForClass(Certificate);
