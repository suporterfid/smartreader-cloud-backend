// src\metrics\metrics.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Event, EventSchema } from '../events/schemas/event.schema';
import { PrometheusService } from './prometheus.service';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';
import { SystemMetrics, SystemMetricsSchema } from './schemas/system-metrics.schema';

@Module({
  imports: [MongooseModule.forFeature(
    [
      { name: Event.name, schema: EventSchema },
      { name: SystemMetrics.name, schema: SystemMetricsSchema }
    ]
  )],
  controllers: [MetricsController, MetricsController],
  providers: [MetricsService, PrometheusService],
  exports: [MetricsService, PrometheusService],
})
export class MetricsModule {}
