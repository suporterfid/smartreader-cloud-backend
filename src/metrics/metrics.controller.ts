import { Controller, Get, Query, BadRequestException, Logger } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse, ApiSecurity } from '@nestjs/swagger';

@ApiTags('Metrics')
@ApiSecurity('x-api-key')
@Controller('metrics')
export class MetricsController {
  private readonly logger = new Logger(MetricsController.name);

  constructor(private readonly metricsService: MetricsService) {}

  @Get('reader')
  @ApiOperation({ summary: 'Get RFID reader metrics' })
  @ApiQuery({ name: 'deviceSerial', required: true, description: 'Device serial' })
  @ApiQuery({ name: 'from', required: false, description: 'Start date (ISO)' })
  @ApiQuery({ name: 'to', required: false, description: 'End date (ISO)' })
  @ApiResponse({ status: 200, description: 'RFID reader metrics' })
  async getReaderMetrics(@Query() query: any) {
    this.logger.log(`Query parameters for reader metrics: ${JSON.stringify(query)}`);
    const metrics = await this.metricsService.getReaderMetrics(query);
    this.logger.log(`Retrieved reader metrics: ${JSON.stringify(metrics)}`);
    return metrics;
  }

  @Get('antennas')
  @ApiOperation({ summary: 'Get RFID reader antenna metrics' })
  @ApiQuery({ name: 'deviceSerial', required: true, description: 'Device serial' })
  @ApiQuery({ name: 'from', required: false, description: 'Start date (ISO)' })
  @ApiQuery({ name: 'to', required: false, description: 'End date (ISO)' })
  @ApiResponse({ status: 200, description: 'Antenna metrics' })
  async getAntennaMetrics(@Query() query: any) {
    this.logger.log(`Query parameters for antenna metrics: ${JSON.stringify(query)}`);
    const metrics = await this.metricsService.getAntennaMetrics(query);
    this.logger.log(`Retrieved antenna metrics: ${JSON.stringify(metrics)}`);
    return metrics;
  }

  @Get('system')
  @ApiOperation({ summary: 'Get system metrics (CPU, memory)' })
  @ApiQuery({ name: 'deviceSerial', required: true, description: 'Device serial' })
  @ApiQuery({ name: 'from', required: false, description: 'Start date (ISO)' })
  @ApiQuery({ name: 'to', required: false, description: 'End date (ISO)' })
  @ApiResponse({ status: 200, description: 'System metrics' })
  async getSystemMetrics(@Query() query: any) {
    this.logger.log(`Query parameters for system metrics: ${JSON.stringify(query)}`);
    const metrics = await this.metricsService.getSystemMetrics(query);
    this.logger.log(`Retrieved system metrics: ${JSON.stringify(metrics)}`);
    return metrics;
  }

  @Get('offline')
  @ApiOperation({ summary: 'Return devices without communication for more than X minutes' })
  @ApiQuery({ name: 'minutes', required: true, description: 'Time interval in minutes to consider the device offline' })
  @ApiResponse({ status: 200, description: 'List of offline devices with the last communication date' })
  async getOfflineDevices(@Query('minutes') minutes: string) {
    this.logger.log(`Checking devices offline for more than ${minutes} minutes`);
    const result = await this.metricsService.getOfflineDevices(parseInt(minutes, 10));
    this.logger.log(`Retrieved ${result.length} offline device(s)`);
    return result;
  }
}

