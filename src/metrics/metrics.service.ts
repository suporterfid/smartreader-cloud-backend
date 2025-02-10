import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Event, EventDocument } from '../events/schemas/event.schema';

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);
  constructor(@InjectModel(Event.name) private eventModel: Model<EventDocument>) {}

  async getReaderMetrics(query: any): Promise<any> {
    const { deviceSerial, from, to } = query;
    const filter: any = {
      eventType: "status",
      "payload.deviceSerial": deviceSerial,
    };
    if (from || to) {
      filter.createdAt = {};
      if (from) {
        filter.createdAt.$gte = new Date(from);
      }
      if (to) {
        filter.createdAt.$lte = new Date(to);
      }
    }
    const pipeline = [
      { $match: filter },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          enabledOperational: {
            $sum: { $cond: [{ $eq: ["$payload.ReaderOperationalStatus", "enabled"] }, 1, 0] },
          },
          enabledAdministrative: {
            $sum: { $cond: [{ $eq: ["$payload.ReaderAdministrativeStatus", "enabled"] }, 1, 0] },
          },
          avgCPU: { $avg: { $toDouble: "$payload.CPUUtilization" } },
          avgUptime: { $avg: { $toDouble: "$payload.UptimeSeconds" } },
        },
      },
      {
        $project: {
          _id: 0,
          totalEvents: "$total",
          readerOperationalAvailability: {
            $multiply: [{ $divide: ["$enabledOperational", "$total"] }, 100],
          },
          readerAdministrativeAvailability: {
            $multiply: [{ $divide: ["$enabledAdministrative", "$total"] }, 100],
          },
          avgCPUUtilization: "$avgCPU",
          avgUptimeSeconds: "$avgUptime",
        },
      },
    ];
    const result = await this.eventModel.aggregate(pipeline).exec();
    return result[0] || {};
  }

  async getAntennaMetrics(query: any): Promise<any> {
    const { deviceSerial, from, to } = query;
    const filter: any = {
      eventType: "status",
      "payload.deviceSerial": deviceSerial,
    };
    if (from || to) {
      filter.createdAt = {};
      if (from) {
        filter.createdAt.$gte = new Date(from);
      }
      if (to) {
        filter.createdAt.$lte = new Date(to);
      }
    }
    const pipeline = [
      { $match: filter },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          avgAntenna1TxPower: { $avg: { $toDouble: "$payload.antenna1TxPower" } },
          enabledAntenna1: { $sum: { $cond: [{ $eq: ["$payload.Antenna1OperationalStatus", "enabled"] }, 1, 0] } },
          avgAntenna2TxPower: { $avg: { $toDouble: "$payload.antenna2TxPower" } },
          enabledAntenna2: { $sum: { $cond: [{ $eq: ["$payload.Antenna2OperationalStatus", "enabled"] }, 1, 0] } },
          avgAntenna3TxPower: { $avg: { $toDouble: "$payload.antenna3TxPower" } },
          enabledAntenna3: { $sum: { $cond: [{ $eq: ["$payload.Antenna3OperationalStatus", "enabled"] }, 1, 0] } },
          avgAntenna4TxPower: { $avg: { $toDouble: "$payload.antenna4TxPower" } },
          enabledAntenna4: { $sum: { $cond: [{ $eq: ["$payload.Antenna4OperationalStatus", "enabled"] }, 1, 0] } },
        },
      },
      {
        $project: {
          _id: 0,
          totalEvents: "$total",
          antenna1OperationalAvailability: { $multiply: [{ $divide: ["$enabledAntenna1", "$total"] }, 100] },
          avgAntenna1TxPower: "$avgAntenna1TxPower",
          antenna2OperationalAvailability: { $multiply: [{ $divide: ["$enabledAntenna2", "$total"] }, 100] },
          avgAntenna2TxPower: "$avgAntenna2TxPower",
          antenna3OperationalAvailability: { $multiply: [{ $divide: ["$enabledAntenna3", "$total"] }, 100] },
          avgAntenna3TxPower: "$avgAntenna3TxPower",
          antenna4OperationalAvailability: { $multiply: [{ $divide: ["$enabledAntenna4", "$total"] }, 100] },
          avgAntenna4TxPower: "$avgAntenna4TxPower",
        },
      },
    ];
    const result = await this.eventModel.aggregate(pipeline).exec();
    return result[0] || {};
  }

  async getSystemMetrics(query: any): Promise<any> {
    const { deviceSerial, from, to } = query;
    const filter: any = {
      eventType: "status",
      "payload.deviceSerial": deviceSerial,
    };
    if (from || to) {
      filter.createdAt = {};
      if (from) {
        filter.createdAt.$gte = new Date(from);
      }
      if (to) {
        filter.createdAt.$lte = new Date(to);
      }
    }
    const pipeline = [
      { $match: filter },
      {
        $group: {
          _id: null,
          avgCPUUtilization: { $avg: { $toDouble: "$payload.CPUUtilization" } },
          avgTotalMemory: { $avg: { $toDouble: "$payload.TotalMemory" } },
          avgFreeMemory: { $avg: { $toDouble: "$payload.FreeMemory" } },
          avgUsedMemory: { $avg: { $toDouble: "$payload.UsedMemory" } },
        },
      },
      {
        $project: {
          _id: 0,
          avgCPUUtilization: 1,
          avgTotalMemory: 1,
          avgFreeMemory: 1,
          avgUsedMemory: 1,
        },
      },
    ];
    const result = await this.eventModel.aggregate(pipeline).exec();
    return result[0] || {};
  }

  /**
   * Retorna todos os dispositivos cujo último evento (do tipo "status")
   * ocorreu há mais de "minutes" minutos, juntamente com a última data de comunicação.
   */
  async getOfflineDevices(minutes: number): Promise<any[]> {
    const threshold = new Date(Date.now() - minutes * 60 * 1000);
    const pipeline = [
      { 
        $match: { 
          eventType: "status", 
          "payload.deviceSerial": { $exists: true, $ne: null } 
        } 
      },
      { 
        $group: { 
          _id: "$payload.deviceSerial", 
          lastCommunication: { $max: "$createdAt" } 
        } 
      },
      { 
        $match: { lastCommunication: { $lte: threshold } } 
      },
      { 
        $project: { 
          _id: 0, 
          deviceSerial: "$_id", 
          lastCommunication: 1 
        } 
      }
    ];
    const result = await this.eventModel.aggregate(pipeline).exec();
    return result;
  }
}
