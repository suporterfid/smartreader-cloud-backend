// src/monitoring/monitoring.controller.ts
import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { MonitoringService } from './monitoring.service';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse, ApiSecurity } from '@nestjs/swagger';

@ApiTags('Monitoring Dashboard')
@ApiSecurity('x-api-key')
@Controller('monitoring')
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Return availability data for the dashboard' })
  @ApiQuery({ name: 'from', required: true, description: 'Start date (ISO)' })
  @ApiQuery({ name: 'to', required: true, description: 'End date (ISO)' })
  @ApiQuery({ name: 'deviceSerial', required: false, description: 'Optional filter by deviceSerial' })
  @ApiResponse({ status: 200, description: 'Availability data for the dashboard' })
  async getDashboardData(@Query() query: any) {
    const { from, to, deviceSerial } = query;
    if (!from || !to) {
      throw new BadRequestException('The "from" and "to" parameters are required.');
    }
    const fromDate = new Date(from);
    const toDate = new Date(to);
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      throw new BadRequestException('The "from" and "to" parameters must be valid dates.');
    }
    // Calculate the number of expected checks within the period, considering a check every 10 minutes.
    const diffMillis = toDate.getTime() - fromDate.getTime();
    const totalExpectedChecks = Math.floor(diffMillis / (10 * 60 * 1000)) + 1;

    return this.monitoringService.getDashboardData({ from: fromDate, to: toDate, deviceSerial, totalExpectedChecks });
  }
}

