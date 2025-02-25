import { SetMetadata } from '@nestjs/common';

export const RateLimit = (limit: number, ttl: number) => SetMetadata('throttle', { limit, ttl });
