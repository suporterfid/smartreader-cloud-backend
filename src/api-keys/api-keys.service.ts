// src/api-keys/api-keys.service.ts
import { Injectable, BadRequestException, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ApiKey, ApiKeyDocument } from './api-key.schema';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ApiKeysService {
  private readonly logger = new Logger(ApiKeysService.name);

  constructor(@InjectModel(ApiKey.name) private apiKeyModel: Model<ApiKeyDocument>) {}

  async onModuleInit() {
    await this.ensureDefaultApiKey();
  }

  async ensureDefaultApiKey(): Promise<void> {
    const existingKey = await this.apiKeyModel.findOne({ key: 'EXAMPLE_API_KEY' }).exec();
    if (!existingKey) {
      this.logger.warn('EXAMPLE_API_KEY not found. Creating default API key...');
      await this.createApiKey('Default API Key', 'admin', 'EXAMPLE_API_KEY');
      this.logger.log('Default API Key created successfully.');
    }
  }

  async createApiKey(description: string, role: string, key?: string): Promise<ApiKey> {
    const validRoles = ['admin', 'operator', 'viewer'];
    if (!validRoles.includes(role)) {
      throw new BadRequestException(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
    }

    const apiKey = key || uuidv4();
    const created = new this.apiKeyModel({ key: apiKey, description, role, active: true });
    return created.save();
  }

  async findAll(): Promise<ApiKey[]> {
    return this.apiKeyModel.find().exec();
  }

  async findById(id: string): Promise<ApiKey> {
    return this.apiKeyModel.findById(id).exec();
  }

  async findByKey(key: string): Promise<ApiKey> {
    return this.apiKeyModel.findOne({ key }).exec();
  }

  async updateApiKey(id: string, updateData: Partial<ApiKey>): Promise<ApiKey> {
    return this.apiKeyModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
  }
  
  async deleteApiKey(id: string): Promise<ApiKey> {
    return this.apiKeyModel.findByIdAndDelete(id).exec();
  }
}
