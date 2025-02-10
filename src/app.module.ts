// src/app.module.ts
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';

import { DevicesModule } from './devices/devices.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { ApiKeyGuard } from './auth/api-key.guard';
import { MqttModule } from './mqtt/mqtt.module';
import { EventsModule } from './events/events.module';
import { CommandsModule } from './commands/commands.module';
import { MetricsModule } from './metrics/metrics.module';
import { MonitoringModule } from './monitoring/monitoring.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(), // Habilita o agendamento
    MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb://localhost/smartreader'),
    ApiKeysModule,
    MqttModule,
    EventsModule,
    CommandsModule,
    MetricsModule,
    MonitoringModule,
    DevicesModule
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ApiKeyGuard,
    },
  ],
})
export class AppModule {}
