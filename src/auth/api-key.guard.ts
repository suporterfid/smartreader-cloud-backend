// src/auth/api-key.guard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { ApiKeysService } from '../api-keys/api-keys.service';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class ApiKeyGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly apiKeysService: ApiKeysService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        // Se o endpoint estiver marcado como público, não exige autenticação
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            return true;
        }

        const request = context.switchToHttp().getRequest<Request>();
        const apiKey = request.headers['x-api-key'];
        if (!apiKey || typeof apiKey !== 'string') {
            throw new UnauthorizedException('API key missing');
        }
        const key = await this.apiKeysService.findByKey(apiKey);
        if (!key || !key.active) {
            throw new UnauthorizedException('Invalid API key');
        }
        return true;
    }
}
