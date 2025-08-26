import { Module } from '@nestjs/common';
import { CacheTestController } from './cache-test.controller';
import { RedisService } from '../database/redis.service';
import { RedisMonitorService } from '../database/redis-monitor.service';

@Module({
  controllers: [CacheTestController],
  providers: [RedisService, RedisMonitorService],
  exports: [RedisMonitorService],
})
export class CacheTestModule {}
