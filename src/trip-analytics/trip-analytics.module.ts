import { Module } from '@nestjs/common';
import { TripAnalyticsController } from './trip-analytics.controller';
import { TripAnalyticsService } from './trip-analytics.service';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../database/redis.service';
import { RedisMonitorService } from '../database/redis-monitor.service';
import { MonitoringService } from '../common/services/monitoring.service';

@Module({
  imports: [],
  controllers: [TripAnalyticsController],
  providers: [
    TripAnalyticsService,
    PrismaService,
    RedisService,
    RedisMonitorService,
    MonitoringService,
  ],
})
export class TripAnalyticsModule {}
