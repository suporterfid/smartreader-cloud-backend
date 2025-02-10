// src/events/events.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Event, EventDocument } from './schemas/event.schema';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);
  constructor(@InjectModel(Event.name) private eventModel: Model<EventDocument>) {}

  async storeEvent(payload: any): Promise<Event> {
    const event = new this.eventModel({
      eventType: payload.eventType || 'unknown',
      payload,
    });
    try {
      const savedEvent = await event.save();
      this.logger.log(`Event saved with ID: ${savedEvent._id}`);
      return savedEvent;
    } catch (error) {
      this.logger.error('Error saving the event', error);
      throw error;
    }
  }

  async getEvents(filter: any): Promise<Event[]> {
    return this.eventModel.find(filter).exec();
  }
}

