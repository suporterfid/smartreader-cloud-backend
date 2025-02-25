import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DeviceLogsService } from './device-logs.service';
import { DeviceLogsController } from './device-logs.controller';
import { DeviceLog, DeviceLogSchema } from './schemas/device-log.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: DeviceLog.name, schema: DeviceLogSchema }])],
  controllers: [DeviceLogsController],
  providers: [DeviceLogsService],
  exports: [DeviceLogsService],
})

export class DeviceLogsModule {}
