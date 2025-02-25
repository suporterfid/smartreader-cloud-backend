// src/webhooks/webhooks.controller.ts
import { Controller, Post, Get, Delete, Body, Query } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}
  @Post()
  async subscribe(
    @Body('url') url: string,
    @Body('eventType') eventType: string,
    @Body('secret') secret?: string,
  ) {
    return this.webhooksService.subscribe(url, eventType, secret);
  }

  @Get()
  async getSubscriptions() {
    return this.webhooksService.getSubscriptions();
  }
  
  @Delete()
  async deleteSubscription(@Query('url') url: string) {
    return this.webhooksService.deleteSubscription(url);
  }
}
