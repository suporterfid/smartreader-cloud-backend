import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DeviceLog, DeviceLogDocument } from './schemas/device-log.schema';

@Injectable()
export class DeviceLogsService {
  private readonly logger = new Logger(DeviceLogsService.name);

  constructor(@InjectModel(DeviceLog.name) private deviceLogModel: Model<DeviceLogDocument>) {}

  async storeLog(deviceSerial: string, severity: string, message: string, metadata?: any): Promise<DeviceLog> {
    if (!['info', 'warning', 'error'].includes(severity)) {
      throw new BadRequestException(`Invalid severity level: ${severity}`);
    }
    const logEntry = new this.deviceLogModel({ deviceSerial, severity, message, metadata });
    return logEntry.save();
  }

  async getDeviceLogs(
    deviceSerial: string,
    severity?: string,
    from?: Date,
    to?: Date
  ): Promise<DeviceLog[]> {
    const filter: any = { deviceSerial };

    if (severity) filter.severity = severity;
    if (from || to) {
      filter.timestamp = {};
      if (from) filter.timestamp.$gte = from;
      if (to) filter.timestamp.$lte = to;
    }
    return this.deviceLogModel.find(filter).sort({ timestamp: -1 }).exec();
  }
  
}
