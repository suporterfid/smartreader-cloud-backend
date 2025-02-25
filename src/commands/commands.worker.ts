import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CommandsService } from './commands.service';

@Injectable()
export class CommandsWorker implements OnModuleInit {
  private readonly logger = new Logger(CommandsWorker.name);
  private readonly CHECK_INTERVAL_MS = 5000;

  constructor(private readonly commandsService: CommandsService) {}

  onModuleInit() {
    this.logger.log('Starting command execution worker...');
    setInterval(() => this.processNextCommand(), this.CHECK_INTERVAL_MS);
  }

  private async processNextCommand() {
    const command = await this.commandsService.getNextCommand();
    if (!command) return;
    this.logger.log(`Executing command: ${command.command_id} with priority ${command.priority}`);
    await this.commandsService.markCommandAsProcessing(command.command_id);
    try {
      const response = await this.executeCommand(command);
      await this.commandsService.updateCommandStatus(command.command_id, 'success', response);
    } catch (error) {
      this.logger.error(`Command execution failed: ${error.message}`);
      await this.commandsService.updateCommandStatus(command.command_id, 'error');
    }
  }
  
  private async executeCommand(command: any): Promise<any> {
    // Simulated command execution logic
    return { success: true, executedAt: new Date() };
  }
}
