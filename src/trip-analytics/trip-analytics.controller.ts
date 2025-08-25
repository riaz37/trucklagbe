import {
  Controller,
  Get,
  Param,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { TripAnalyticsService } from './trip-analytics.service';
import { DriverAnalytics } from '../database/database.service';

@Controller('api/v1/drivers')
export class TripAnalyticsController {
  constructor(private readonly tripAnalyticsService: TripAnalyticsService) {}

  @Get(':driverId/analytics')
  async getDriverAnalytics(
    @Param('driverId') driverId: string,
    @Query('optimized') optimized: string = 'false',
  ): Promise<DriverAnalytics> {
    const driverIdNum = parseInt(driverId);

    if (isNaN(driverIdNum)) {
      throw new HttpException('Invalid driver ID', HttpStatus.BAD_REQUEST);
    }

    try {
      if (optimized === 'true') {
        return await this.tripAnalyticsService.getDriverAnalyticsOptimized(
          driverIdNum,
        );
      } else {
        return await this.tripAnalyticsService.getDriverAnalyticsUnoptimized(
          driverIdNum,
        );
      }
    } catch (error) {
      if (error.message === 'Driver not found') {
        throw new HttpException('Driver not found', HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':driverId/analytics/unoptimized')
  async getDriverAnalyticsUnoptimized(
    @Param('driverId') driverId: string,
  ): Promise<DriverAnalytics> {
    const driverIdNum = parseInt(driverId);

    if (isNaN(driverIdNum)) {
      throw new HttpException('Invalid driver ID', HttpStatus.BAD_REQUEST);
    }

    try {
      return await this.tripAnalyticsService.getDriverAnalyticsUnoptimized(
        driverIdNum,
      );
    } catch (error) {
      if (error.message === 'Driver not found') {
        throw new HttpException('Driver not found', HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':driverId/analytics/optimized')
  async getDriverAnalyticsOptimized(
    @Param('driverId') driverId: string,
  ): Promise<DriverAnalytics> {
    const driverIdNum = parseInt(driverId);

    if (isNaN(driverIdNum)) {
      throw new HttpException('Invalid driver ID', HttpStatus.BAD_REQUEST);
    }

    try {
      return await this.tripAnalyticsService.getDriverAnalyticsOptimized(
        driverIdNum,
      );
    } catch (error) {
      if (error.message === 'Driver not found') {
        throw new HttpException('Driver not found', HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
