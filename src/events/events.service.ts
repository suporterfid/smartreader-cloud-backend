// src/events/events.service.ts
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
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

  async storeEventsBulk(events: any[]): Promise<void> {
    if (!events.length) return;
      try {
      await this.eventModel.insertMany(events);
      this.logger.log(`Successfully stored ${events.length} events in bulk.`);
    } catch (error) {
      this.logger.error(`Error storing bulk events: ${error.message}`);
    }
  }

  async getEvents(filter: any): Promise<Event[]> {
    return this.eventModel.find(filter).exec();
  }

  async handleIncomingEvent(eventType: string, eventData: any): Promise<void> {
    await this.eventModel.create(eventData);
    // Ensure event dispatching logic is correct
    // await this.webhooksService.dispatchEvent(eventType, eventData);
  }

  async getFilteredEvents(
    deviceSerial?: string,
    epcPrefix?: string,
    antenna?: number,
    rssiMin?: number,
    rssiMax?: number,
    from?: Date,
    to?: Date
  ): Promise<Event[]> {
    const filter: any = {};

    if (deviceSerial) filter.deviceSerial = deviceSerial;
    if (epcPrefix) filter['payload.epc'] = new RegExp(`^${epcPrefix}`);
    if (antenna !== undefined) filter['payload.antenna'] = antenna;
    if (rssiMin !== undefined || rssiMax !== undefined) {
      filter['payload.rssi'] = {};
      if (rssiMin !== undefined) filter['payload.rssi'].$gte = rssiMin;
      if (rssiMax !== undefined) filter['payload.rssi'].$lte = rssiMax;
    }
    if (from || to) {
      filter.timestamp = {};
      if (from) filter.timestamp.$gte = from;
      if (to) filter.timestamp.$lte = to;
    }

    try {
      return await this.eventModel.find(filter).exec();
    } catch (error) {
      this.logger.error('Error querying events', error);
      throw new BadRequestException('Invalid query parameters');
    }
  }
}

