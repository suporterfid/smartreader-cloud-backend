import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { FirmwaresController } from './firmwares.controller';
import { FirmwareCategoriesController } from './firmware-categories.controller';
import { FirmwaresService } from './firmwares.service';
import { FirmwareCategoriesService } from './firmware-categories.service';
import { Firmware, FirmwareSchema } from './schemas/firmware.schema';
import { FirmwareCategory, FirmwareCategorySchema } from './schemas/firmware-category.schema';
import { Device, DeviceSchema } from '../devices/schemas/device.schema';
import { MqttModule } from '../mqtt/mqtt.module';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), 'uploads/firmwares');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Firmware.name, schema: FirmwareSchema },
      { name: FirmwareCategory.name, schema: FirmwareCategorySchema },
      { name: Device.name, schema: DeviceSchema }
    ]),
    MulterModule.register({
      storage: diskStorage({
        destination: uploadDir,
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}-${file.originalname}`);
        },
      }),
    }),
    MqttModule
  ],
  controllers: [FirmwaresController, FirmwareCategoriesController],
  providers: [FirmwaresService, FirmwareCategoriesService],
  exports: [FirmwaresService, FirmwareCategoriesService],
})
export class FirmwaresModule {}
