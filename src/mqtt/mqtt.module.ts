// src/mqtt/mqtt.module.ts
import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MqttService } from './mqtt.service';
import { MqttController } from './mqtt.controller';
import { EventsModule } from '../events/events.module';
import { CommandsModule } from '../commands/commands.module';


@Module({
  imports: [EventEmitterModule.forRoot(), EventsModule, CommandsModule],
  providers: [MqttService],
  controllers: [MqttController],
  exports: [MqttService],
})
export class MqttModule {}
