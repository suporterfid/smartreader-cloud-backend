// src/monitoring/monitoring.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MonitoringHistory, MonitoringHistorySchema } from './monitoring-history.schema';
import { MonitoringService } from './monitoring.service';
import { MonitoringController } from './monitoring.controller';
import { MetricsModule } from '../metrics/metrics.module';

@Module({
  imports: [
    MetricsModule,
    MongooseModule.forFeature([{ name: MonitoringHistory.name, schema: MonitoringHistorySchema }]),
  ],
  providers: [MonitoringService],
  controllers: [MonitoringController],
  exports: [MonitoringService],
})
export class MonitoringModule {}
