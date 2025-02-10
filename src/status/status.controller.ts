// src/status/status.controller.ts
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';

@ApiTags('Status')
@ApiSecurity('x-api-key')
@Controller('api/status')
export class StatusController {
  @Get()
  @ApiOperation({ summary: 'Check API Status' })
  @ApiResponse({ status: 200, description: 'API is running' })
  getStatus() {
    return { status: 'API is running', timestamp: new Date() };
  }
}
