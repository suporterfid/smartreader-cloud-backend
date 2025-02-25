import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ApiKey, ApiKeyDocument } from '../../api-keys/api-key.schema';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(@InjectModel(ApiKey.name) private apiKeyModel: Model<ApiKeyDocument>) {}

  async use(req: any, res: any, next: () => void) {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) throw new UnauthorizedException('Missing API key');
    
    const keyRecord = await this.apiKeyModel.findOne({ key: apiKey, active: true });
    if (!keyRecord) throw new UnauthorizedException('Invalid or inactive API key');
    
    req.user = { role: keyRecord.role };
    next();
  }
}
