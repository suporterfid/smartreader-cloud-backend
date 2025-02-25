// src/commands/commands.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Command, CommandSchema } from './schemas/command.schema';
import { CommandsService } from './commands.service';
import { CommandsController } from './commands.controller';
import { CommandsWorker } from './commands.worker';

@Module({
  imports: [MongooseModule.forFeature([{ name: Command.name, schema: CommandSchema }])],
  providers: [CommandsService, CommandsWorker],
  controllers: [CommandsController],
  exports: [CommandsService],
})
export class CommandsModule {}
