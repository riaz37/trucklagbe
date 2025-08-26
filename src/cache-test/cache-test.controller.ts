import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Logger,
} from '@nestjs/common';
import { RedisService } from '../database/redis.service';
import { RedisMonitorService } from '../database/redis-monitor.service';

@Controller('cache-test')
export class CacheTestController {
  private readonly logger = new Logger(CacheTestController.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly redisMonitor: RedisMonitorService,
  ) {}

  // Test basic cache operations
  @Post('set/:key')
  async setCache(
    @Param('key') key: string,
    @Query('value') value: string,
    @Query('ttl') ttl: number = 300,
  ) {
    const startTime = Date.now();

    try {
      await this.redisService.set(key, value, ttl);
      const responseTime = Date.now() - startTime;

      this.logger.log(
        `Cache SET: ${key} = ${value} (TTL: ${ttl}s) - ${responseTime}ms`,
      );

      return {
        success: true,
        key,
        value,
        ttl,
        responseTime,
        message: 'Value cached successfully',
      };
    } catch (error) {
      this.logger.error(`Cache SET failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get('get/:key')
  async getCache(@Param('key') key: string) {
    const startTime = Date.now();

    try {
      const value = await this.redisService.get(key);
      const responseTime = Date.now() - startTime;

      if (value !== null) {
        this.redisMonitor.recordHit(responseTime);
        this.logger.log(`Cache HIT: ${key} - ${responseTime}ms`);
      } else {
        this.redisMonitor.recordMiss(responseTime);
        this.logger.log(`Cache MISS: ${key} - ${responseTime}ms`);
      }

      return {
        success: true,
        key,
        value,
        responseTime,
        cacheStatus: value !== null ? 'HIT' : 'MISS',
      };
    } catch (error) {
      this.logger.error(`Cache GET failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Delete('delete/:key')
  async deleteCache(@Param('key') key: string) {
    const startTime = Date.now();

    try {
      await this.redisService.del(key);
      const responseTime = Date.now() - startTime;

      this.logger.log(`Cache DELETE: ${key} - ${responseTime}ms`);

      return {
        success: true,
        key,
        responseTime,
        message: 'Key deleted successfully',
      };
    } catch (error) {
      this.logger.error(`Cache DELETE failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get cache metrics
  @Get('metrics')
  async getMetrics() {
    try {
      const metrics = this.redisMonitor.getMetrics();
      const memoryUsage = await this.redisMonitor.getMemoryUsage();

      return {
        success: true,
        metrics,
        memoryUsage,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to get metrics: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Reset metrics
  @Post('metrics/reset')
  async resetMetrics() {
    try {
      this.redisMonitor.resetMetrics();

      return {
        success: true,
        message: 'Metrics reset successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to reset metrics: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get Redis info
  @Get('redis/info')
  async getRedisInfo() {
    try {
      const info = await this.redisMonitor.getRedisInfo();

      return {
        success: true,
        info,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to get Redis info: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get all keys
  @Get('redis/keys')
  async getAllKeys(@Query('pattern') pattern: string = '*') {
    try {
      const keys = await this.redisMonitor.getAllKeys(pattern);

      return {
        success: true,
        pattern,
        keyCount: keys.length,
        keys: keys.slice(0, 100), // Limit to first 100 keys
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to get Redis keys: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Test cache performance with multiple requests
  @Post('test-performance')
  async testPerformance(@Query('iterations') iterations: number = 10) {
    const results = [];
    const testKey = 'performance-test';
    const testValue = { data: 'test-value', timestamp: Date.now() };

    try {
      // Set initial value
      await this.redisService.set(testKey, testValue, 60);

      // Test multiple reads
      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        const value = await this.redisService.get(testKey);
        const responseTime = Date.now() - startTime;

        results.push({
          iteration: i + 1,
          responseTime,
          cacheStatus: value !== null ? 'HIT' : 'MISS',
        });
      }

      // Clean up
      await this.redisService.del(testKey);

      const avgResponseTime =
        results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;

      return {
        success: true,
        iterations,
        results,
        averageResponseTime: avgResponseTime,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Performance test failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Health check
  @Get('health')
  async healthCheck() {
    try {
      const redisHealthy = await this.redisService.healthCheck();

      return {
        success: true,
        redis: redisHealthy,
        timestamp: new Date().toISOString(),
        status: redisHealthy ? 'healthy' : 'unhealthy',
      };
    } catch (error) {
      this.logger.error(`Health check failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
        status: 'unhealthy',
      };
    }
  }
}
