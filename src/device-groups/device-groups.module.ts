import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DeviceGroup, DeviceGroupSchema } from './schemas/device-group.schema';
import { Device, DeviceSchema } from '../devices/schemas/device.schema';
import { Command, CommandSchema } from '../commands/schemas/command.schema';
import { DeviceGroupsService } from './device-groups.service';
import { DeviceGroupsController } from './device-groups.controller';
import { MqttModule } from '../mqtt/mqtt.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DeviceGroup.name, schema: DeviceGroupSchema },
      { name: Device.name, schema: DeviceSchema },
      { name: Command.name, schema: CommandSchema },
    ]),
    MqttModule
  ],
  controllers: [DeviceGroupsController],
  providers: [DeviceGroupsService],
  exports: [DeviceGroupsService]
})
export class DeviceGroupsModule {}
