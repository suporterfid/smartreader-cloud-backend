// src/api-keys/api-keys.controller.ts
import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { ApiTags, ApiOperation, ApiParam, ApiBody, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { Public } from '../auth/public.decorator';

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
      },
      required: ['description'],
    },
  })
  @ApiResponse({ status: 201, description: 'API key successfully created.' })
  async createApiKey(@Body('description') description: string) {
    const apiKey = await this.apiKeysService.createApiKey(description);
    return { message: 'API key successfully created', apiKey };
  }

  @Get()
  @ApiOperation({ summary: 'List all registered API keys' })
  @ApiResponse({ status: 200, description: 'List of API keys.' })
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

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an API key' })
  @ApiParam({ name: 'id', description: 'API key ID' })
  @ApiResponse({ status: 200, description: 'API key deleted.' })
  async deleteApiKey(@Param('id') id: string) {
    return this.apiKeysService.deleteApiKey(id);
  }
}

