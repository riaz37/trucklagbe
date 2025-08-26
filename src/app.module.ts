import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TripAnalyticsModule } from './trip-analytics/trip-analytics.module';
import { RedisService } from './database/redis.service';
import { RedisMonitorService } from './database/redis-monitor.service';
import { CacheTestModule } from './cache-test/cache-test.module';
import { MonitoringService } from './common/services/monitoring.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TripAnalyticsModule,
    CacheTestModule,
  ],
  controllers: [AppController],
  providers: [AppService, RedisService, RedisMonitorService, MonitoringService],
  exports: [RedisService, RedisMonitorService, MonitoringService],
})
export class AppModule {}
