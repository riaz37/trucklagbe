import { Module } from '@nestjs/common';
import { TripAnalyticsController } from './trip-analytics.controller';
import { TripAnalyticsService } from './trip-analytics.service';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../database/redis.service';

@Module({
  imports: [],
  controllers: [TripAnalyticsController],
  providers: [TripAnalyticsService, PrismaService, RedisService],
})
export class TripAnalyticsModule {}
