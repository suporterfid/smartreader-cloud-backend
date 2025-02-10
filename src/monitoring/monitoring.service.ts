// src/monitoring/monitoring.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { MetricsService } from '../metrics/metrics.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MonitoringHistory, MonitoringHistoryDocument } from './monitoring-history.schema';

@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);
  // Defines the threshold to consider a device offline (in minutes)
  private readonly thresholdMinutes = 10;

  constructor(
    private readonly metricsService: MetricsService,
    @InjectModel(MonitoringHistory.name)
    private readonly monitoringHistoryModel: Model<MonitoringHistoryDocument>,
  ) {}

  // Executes the offline device check every 10 minutes
  @Cron('*/10 * * * *')
  async handleCron() {
    this.logger.log('Executing offline device check...');
    try {
      // Retrieves devices without communication for more than thresholdMinutes minutes
      const offlineDevices = await this.metricsService.getOfflineDevices(this.thresholdMinutes);
      if (offlineDevices && offlineDevices.length > 0) {
        const checkTimestamp = new Date();
        const records = offlineDevices.map(device => ({
          deviceSerial: device.deviceSerial,
          lastCommunication: device.lastCommunication,
          checkTimestamp,
        }));
        await this.monitoringHistoryModel.insertMany(records);
        this.logger.log(`Recorded ${records.length} offline device occurrences.`);
      } else {
        this.logger.log('No offline devices found.');
      }
    } catch (error) {
      this.logger.error('Error checking offline devices', error);
    }
  }

  /**
   * Returns availability data for dashboard consumption.
   *
   * @param params.from Start date of the period (Date)
   * @param params.to End date of the period (Date)
   * @param params.deviceSerial (optional) filter by deviceSerial
   * @param params.totalExpectedChecks Number of expected checks during the period (calculated in the controller)
   */
  async getDashboardData({ from, to, deviceSerial, totalExpectedChecks }): Promise<any[]> {
    const filter: any = {
      checkTimestamp: { $gte: from, $lte: to },
    };
    if (deviceSerial) {
      filter.deviceSerial = deviceSerial;
    }
    const pipeline = [
      { $match: filter },
      {
        $group: {
          _id: "$deviceSerial",
          offlineCount: { $sum: 1 },
          lastCommunication: { $max: "$lastCommunication" },
        },
      },
      {
        $project: {
          _id: 0,
          deviceSerial: "$_id",
          offlineCount: 1,
          totalExpectedChecks: { $literal: totalExpectedChecks },
          availabilityPercentage: {
            $multiply: [
              { $subtract: [1, { $divide: ["$offlineCount", totalExpectedChecks] }] },
              100
            ]
          },
          lastCommunication: 1,
        },
      },
    ];
    const result = await this.monitoringHistoryModel.aggregate(pipeline).exec();
    return result;
  }
}

