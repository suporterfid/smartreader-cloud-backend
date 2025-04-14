// src/provisioning/provisioning.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProvisioningController } from './provisioning.controller';
import { ProvisioningService } from './provisioning.service';
import { ProvisioningTemplate, ProvisioningTemplateSchema } from './schemas/provisioning-template.schema';
import { Device, DeviceSchema } from '../devices/schemas/device.schema';
import { CertificatesModule } from '../certificates/certificates.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProvisioningTemplate.name, schema: ProvisioningTemplateSchema },
      { name: Device.name, schema: DeviceSchema }
    ]),
    CertificatesModule
  ],
  controllers: [ProvisioningController],
  providers: [ProvisioningService],
  exports: [ProvisioningService]
})
export class ProvisioningModule {}
