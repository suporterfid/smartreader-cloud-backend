// src\commands\commands.controller.ts
import { Controller, Get, Query, Param, Post, Body, Logger } from '@nestjs/common';
import { CommandsService } from './commands.service';
import { ApiTags, ApiOperation, ApiQuery, ApiParam, ApiResponse, ApiSecurity } from '@nestjs/swagger';

@ApiTags('Commands')
@ApiSecurity('x-api-key')
@Controller('commands')
export class CommandsController {
  private readonly logger = new Logger(CommandsController.name);

  constructor(private readonly commandsService: CommandsService) {}

  @Get()
  @ApiOperation({ summary: 'Get command history' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by command type (control/management)' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by command status (pending, success, error)' })
  @ApiQuery({ name: 'deviceSerial', required: false, description: 'Filter by device serial' })
  @ApiQuery({ name: 'from', required: false, description: 'Start date for filtering (ISO string)' })
  @ApiQuery({ name: 'to', required: false, description: 'End date for filtering (ISO string)' })
  @ApiResponse({ status: 200, description: 'List of commands.' })
  async getCommands(@Query() query: any) {
    this.logger.log(`Received query parameters: ${JSON.stringify(query)}`);

    const filter: any = {};
    if (query.type) filter.type = Array.isArray(query.type) ? { $in: query.type } : query.type;
    if (query.status) filter.status = query.status;
    if (query.deviceSerial) filter.deviceSerial = query.deviceSerial;
    if (query.from || query.to) {
      filter.createdAt = {};
      if (query.from) filter.createdAt.$gte = new Date(query.from);
      if (query.to) filter.createdAt.$lte = new Date(query.to);
    }

    this.logger.log(`Generated filter for commands: ${JSON.stringify(filter)}`);
    const commands = await this.commandsService.getCommands(filter);
    this.logger.log(`Retrieved ${commands.length} command(s) matching the filter`);
    return commands;
  }

  @Get(':commandId')
  @ApiOperation({ summary: 'Get details of a specific command' })
  @ApiParam({ name: 'commandId', description: 'Command ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Command details.' })
  async getCommandById(@Param('commandId') commandId: string) {
    this.logger.log(`Fetching command details for commandId: ${commandId}`);
    const command = await this.commandsService.getCommandById(commandId);
    this.logger.log(`Retrieved command: ${JSON.stringify(command)}`);
    return command;
  }

  @Post()
  async createCommand(
    @Body('deviceSerial') deviceSerial: string,
    @Body('type') type: string,
    @Body('payload') payload: any,
    @Body('priority') priority?: string,
    @Body('executeAt') executeAt?: string,
  ) {
    const commandData = {
      deviceSerial,
      type,
      payload,
      priority: priority || 'medium',
      executeAt: executeAt ? new Date(executeAt) : undefined,
      status: 'pending',
    };

    return this.commandsService.createCommand(commandData);
  }

  @Get(':commandId/status')
  async getCommandStatus(@Param('commandId') commandId: string) {
    return this.commandsService.getCommandStatus(commandId);
  }

}

