// src/commands/commands.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Command, CommandDocument } from './schemas/command.schema';

@Injectable()
export class CommandsService {
  private readonly logger = new Logger(CommandsService.name);
  constructor(@InjectModel(Command.name) private commandModel: Model<CommandDocument>) {}

  async createCommand(commandData: Partial<Command>): Promise<Command> {
    const createdCommand = new this.commandModel(commandData);
    return createdCommand.save();
  }

  async updateCommand(commandId: string, updateData: Partial<Command>): Promise<Command> {
    return this.commandModel.findOneAndUpdate({ commandId }, updateData, { new: true }).exec();
  }

  async getCommandById(commandId: string): Promise<Command> {
    return this.commandModel.findOne({ commandId }).exec();
  }

  async getCommands(filter: any): Promise<Command[]> {
    return this.commandModel.find(filter).exec();
  }
}
