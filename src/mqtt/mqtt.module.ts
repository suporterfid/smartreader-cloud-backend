// src/mqtt/mqtt.module.ts
import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MqttService } from './mqtt.service';
import { MqttController } from './mqtt.controller';
import { EventsModule } from '../events/events.module';
import { CommandsModule } from '../commands/commands.module';
import { ReferenceListsModule } from '../reference-lists/reference-lists.module';


@Module({
  imports: [
    EventEmitterModule.forRoot(),
    EventsModule,
    CommandsModule,
    ReferenceListsModule,
  ],
  providers: [MqttService],
  controllers: [MqttController],
  exports: [MqttService],
})
export class MqttModule {}
