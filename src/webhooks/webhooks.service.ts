// src/webhooks/webhooks.service.ts
import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Webhook, WebhookDocument } from './schemas/webhook.schema';
import * as axios from 'axios';
import * as crypto from 'crypto';
@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);
  constructor(@InjectModel(Webhook.name) private webhookModel: Model<WebhookDocument>) {}
  
  async subscribe(url: string, eventType: string, secret?: string): Promise<Webhook> {
    if (!url || !eventType) throw new BadRequestException('Missing URL or event type.');
    return this.webhookModel.create({ url, eventType, secret });
  }

  async getSubscriptions(): Promise<Webhook[]> {
    return this.webhookModel.find({ status: 'active' }).exec();
  }

  async deleteSubscription(url: string): Promise<void> {
    const result = await this.webhookModel.deleteOne({ url });
    if (result.deletedCount === 0) throw new NotFoundException('Webhook not found.');
  }
  async dispatchEvent(eventType: string, eventData: any): Promise<void> {
    const webhooks = await this.webhookModel.find({ eventType, status: 'active' }).exec();
    for (const webhook of webhooks) {
      this.sendWebhook(webhook, eventData);
    }
  }

  private async sendWebhook(webhook: Webhook, eventData: any): Promise<void> {
    try {
      const payload = JSON.stringify(eventData);
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (webhook.secret) {
        const signature = crypto.createHmac('sha256', webhook.secret).update(payload).digest('hex');
        headers['X-Webhook-Signature'] = signature;
      }
      await axios.default.post(webhook.url, eventData, { headers });
    } catch (error) {
      this.logger.error(`Webhook delivery failed: ${webhook.url}`, error);
    }
  }
}
