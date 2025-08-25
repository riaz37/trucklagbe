import { Module } from '@nestjs/common';
import { TripAnalyticsController } from './trip-analytics.controller';
import { TripAnalyticsService } from './trip-analytics.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [TripAnalyticsController],
  providers: [TripAnalyticsService],
})
export class TripAnalyticsModule {}
