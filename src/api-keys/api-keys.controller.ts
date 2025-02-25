// src/api-keys/api-keys.controller.ts
import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { RbacGuard } from '../auth/guards/rbac.guard';
import { ApiTags, ApiOperation, ApiParam, ApiBody, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { Public } from '../auth/public.decorator';
import { RateLimit } from '../auth/decorators/rate-limit.decorator';

@ApiTags('API Keys')
@ApiSecurity('x-api-key')
@Controller('apikeys')
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Public()
  @Post()
  @ApiOperation({ summary: 'Create a new API key' })
  @ApiBody({
    description: 'Data for creating the API key',
    schema: {
      type: 'object',
      properties: {
        description: { type: 'string', example: 'Mobile Application' },
        role: { type: 'string', example: 'admin' },
        },
        required: ['description', 'role'],
      },
    })
  @ApiResponse({ status: 201, description: 'API key successfully created.' })
  @UseGuards(RbacGuard)
  @Roles('admin')
  @RateLimit(5, 60) // 5 requests per minute
  async createApiKey(@Body('description') description: string, @Body('role') role: string) {
    const apiKey = this.apiKeysService.createApiKey(description, role);
    return { message: 'API key successfully created', apiKey };
  }

  @Get()
  @ApiOperation({ summary: 'List all registered API keys' })
  @ApiResponse({ status: 200, description: 'List of API keys.' })
  @RateLimit(10, 60) // 10 requests per minute
  async getAllApiKeys() {
    return this.apiKeysService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a specific API key' })
  @ApiParam({ name: 'id', description: 'API key ID' })
  @ApiResponse({ status: 200, description: 'API key details.' })
  async getApiKeyById(@Param('id') id: string) {
    return this.apiKeysService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an API key' })
  @ApiParam({ name: 'id', description: 'API key ID' })
  @ApiBody({
    description: 'Data for updating the API key',
    schema: {
      type: 'object',
      properties: {
        description: { type: 'string' },
        active: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'API key updated.' })
  async updateApiKey(@Param('id') id: string, @Body() updateData: any) {
    return this.apiKeysService.updateApiKey(id, updateData);
  }

  // @Delete(':id')
  // @ApiOperation({ summary: 'Delete an API key' })
  // @ApiParam({ name: 'id', description: 'API key ID' })
  // @ApiResponse({ status: 200, description: 'API key deleted.' })
  // async deleteApiKey(@Param('id') id: string) {
  //   return this.apiKeysService.deleteApiKey(id);
  // }
}

