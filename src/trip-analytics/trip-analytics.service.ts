import { Injectable } from '@nestjs/common';
import { DatabaseService, DriverAnalytics } from '../database/database.service';

@Injectable()
export class TripAnalyticsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getDriverAnalyticsUnoptimized(
    driverId: number,
  ): Promise<DriverAnalytics> {
    return await this.databaseService.getDriverAnalyticsUnoptimized(driverId);
  }

  async getDriverAnalyticsOptimized(
    driverId: number,
  ): Promise<DriverAnalytics> {
    return await this.databaseService.getDriverAnalyticsOptimized(driverId);
  }

  async createSampleData(): Promise<void> {
    await this.databaseService.createSampleData();
  }
}
