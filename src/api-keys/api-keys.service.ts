// src/api-keys/api-keys.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ApiKey, ApiKeyDocument } from './api-key.schema';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ApiKeysService {
  constructor(@InjectModel(ApiKey.name) private apiKeyModel: Model<ApiKeyDocument>) {}

  async createApiKey(description: string): Promise<ApiKey> {
    const key = uuidv4(); //  Generates a unique ID
    const created = new this.apiKeyModel({ key, description });
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
