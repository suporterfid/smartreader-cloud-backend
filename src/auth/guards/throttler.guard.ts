import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class ApiKeyThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(context: ExecutionContext): Promise<string> {
    const request = context.switchToHttp().getRequest();
    return request.user?.apiKey || request.ip; // Track by API key, fallback to IP
  }
  
  protected getLimit(context: ExecutionContext): { limit: number; ttl: number } {
    const request = context.switchToHttp().getRequest();
    const role = request.user?.role || 'viewer';
    const rateLimits = {
      admin: { limit: 200, ttl: 60 }, // 200 requests per minute
      operator: { limit: 100, ttl: 60 }, // 100 requests per minute
      viewer: { limit: 50, ttl: 60 }, // 50 requests per minute
    };
    return rateLimits[role] || rateLimits.viewer;
  }
}
