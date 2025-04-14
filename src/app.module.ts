// src/app.module.ts (Updated with Provisioning and Certificates)
import { Module, MiddlewareConsumer, NestModule, OnModuleInit  } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';

import { ClaimTokensModule } from './claim-tokens/claim-tokens.module';
import { DevicesModule } from './devices/devices.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { ApiKeyGuard } from './auth/api-key.guard';
import { MqttModule } from './mqtt/mqtt.module';
import { EventsModule } from './events/events.module';
import { CommandsModule } from './commands/commands.module';
import { MetricsModule } from './metrics/metrics.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { AuthMiddleware } from './auth/middleware/auth.middleware';
import { DeviceLogsModule } from './device-logs/device-logs.module';
import { ApiKeysService } from './api-keys/api-keys.service';
import { AuthModule } from './auth/auth.module';
import { FirmwaresModule } from './firmwares/firmware.module';
import { DeviceGroupsModule } from './device-groups/device-groups.module';
import { Device, DeviceSchema } from './devices/schemas/device.schema';
import { Command, CommandSchema } from './commands/schemas/command.schema';
// New Modules for Device Provisioning
import { ProvisioningModule } from './provisioning/provisioning.module';
import { CertificatesModule } from './certificates/certificates.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(), // Habilita o agendamento
    //MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb://192.168.68.118:27017/smartreader', {
    MongooseModule.forRoot('mongodb://192.168.68.118:27017/smartreader', {
        retryWrites: true,
        w: 'majority',
        serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    }),

    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 10,
        },
      ],
    }),
    ClaimTokensModule,
    ApiKeysModule,
    MqttModule,
    EventsModule,
    CommandsModule,
    MetricsModule,
    MonitoringModule,
    DevicesModule,
    WebhooksModule,
    DeviceLogsModule,
    AuthModule,
    FirmwaresModule,
    DeviceGroupsModule,
    // Add the new modules
    ProvisioningModule,
    CertificatesModule
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ApiKeyGuard,
    },
  ],
})

export class AppModule implements NestModule, OnModuleInit  {
  constructor(private readonly apiKeysService: ApiKeysService) {}
  
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes('*');
  }

  async onModuleInit() {
    await this.apiKeysService.ensureDefaultApiKey();
  }
}
