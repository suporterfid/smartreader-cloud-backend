import { Controller, Post, Get, Body, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { DeviceLogsService } from './device-logs.service';

@Controller('device-logs')
export class DeviceLogsController {
  constructor(private readonly deviceLogsService: DeviceLogsService) {}

  @Post()
  async storeLog(
    @Body('deviceSerial') deviceSerial: string,
    @Body('severity') severity: string,
    @Body('message') message: string,
    @Body('metadata') metadata?: any
  ) {
    return this.deviceLogsService.storeLog(deviceSerial, severity, message, metadata);
  }
  
  @Get(':deviceSerial')
  @ApiOperation({ summary: 'Retrieve device logs' })
  @ApiParam({ name: 'deviceSerial', description: 'Device serial' })
  @ApiQuery({ name: 'severity', required: false, description: 'Filter by log severity (info, warning, error)' })
  @ApiQuery({ name: 'from', required: false, description: 'Start date (ISO format)' })
  @ApiQuery({ name: 'to', required: false, description: 'End date (ISO format)' })
  @ApiResponse({ status: 200, description: 'List of device logs.' })
  async getDeviceLogs(
    @Param('deviceSerial') deviceSerial: string,
    @Query('severity') severity?: string,
    @Query('from') from?: string,
    @Query('to') to?: string
  ) {
    return this.deviceLogsService.getDeviceLogs(
      deviceSerial,
      severity,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined
    );
  }
}