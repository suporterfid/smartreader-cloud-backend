// src\events\events.controller.ts
import { Controller, Get, Query, Logger } from '@nestjs/common';
import { EventsService } from './events.service';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse, ApiSecurity } from '@nestjs/swagger';

@ApiTags('Events')
@ApiSecurity('x-api-key')
@Controller('events')
export class EventsController {
  private readonly logger = new Logger(EventsController.name);

  constructor(private readonly eventsService: EventsService) {}

  private getFirstParam(param: any): any {
    return Array.isArray(param) ? param[0] : param;
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve stored events' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by event type' })
  @ApiQuery({ name: 'deviceSerial', required: false, description: 'Filter by device serial' })
  @ApiQuery({ name: 'from', required: false, description: 'Start date for filtering (ISO string)' })
  @ApiQuery({ name: 'to', required: false, description: 'End date for filtering (ISO string)' })
  @ApiResponse({ status: 200, description: 'List of events.' })
  async getEvents(@Query() query: any) {
    this.logger.log(`Received query parameters: ${JSON.stringify(query)}`);

    const type = this.getFirstParam(query.type);
    const deviceSerial = this.getFirstParam(query.deviceSerial);
    const from = this.getFirstParam(query.from);
    const to = this.getFirstParam(query.to);

    const filter: any = {};

    // Handle eventType filtering
    if (type) {
      filter.eventType = { $in: Array.isArray(type) ? type : [type] };
    }

    // Handle deviceSerial filtering
    if (deviceSerial) {
      filter['payload.deviceSerial'] = { $in: Array.isArray(deviceSerial) ? deviceSerial : [deviceSerial] };
    }

    // Handle date filtering with proper validation
    const currentDate = new Date();
    const defaultFromDate = new Date();
    defaultFromDate.setDate(currentDate.getDate() - 30); // Default: 30 days before current date

    const fromDate = new Date(from);
    const toDate = new Date(to);

    filter.createdAt = {
      $gte: isNaN(fromDate.getTime()) ? defaultFromDate : fromDate,
      $lte: isNaN(toDate.getTime()) ? currentDate : toDate,
    };

    this.logger.log(`Generated filter for events: ${JSON.stringify(filter)}`);

    try {
      const events = await this.eventsService.getEvents(filter);
      this.logger.log(`Retrieved ${events.length} event(s) matching the filter`);
      return events;
    } catch (error) {
      this.logger.error('Error retrieving events', error);
      throw error;
    }
  }
  
  @Get()
  async getFilteredEvents(
    @Query('deviceSerial') deviceSerial?: string,
    @Query('epcPrefix') epcPrefix?: string,
    @Query('antenna') antenna?: string,
    @Query('rssiMin') rssiMin?: string,
    @Query('rssiMax') rssiMax?: string,
    @Query('from') from?: string,
    @Query('to') to?: string
  ) {
    return this.eventsService.getFilteredEvents(
      deviceSerial,
      epcPrefix,
      antenna ? parseInt(antenna, 10) : undefined,
      rssiMin ? parseFloat(rssiMin) : undefined,
      rssiMax ? parseFloat(rssiMax) : undefined,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined
    );
  }
}
