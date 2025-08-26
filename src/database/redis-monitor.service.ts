import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from './redis.service';

export interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
  averageResponseTime: number;
  totalRequests: number;
  lastReset: Date;
}

@Injectable()
export class RedisMonitorService {
  private readonly logger = new Logger(RedisMonitorService.name);
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    hitRate: 0,
    averageResponseTime: 0,
    totalRequests: 0,
    lastReset: new Date(),
  };

  constructor(private readonly redisService: RedisService) {}

  // Track cache hit
  recordHit(responseTime: number) {
    this.metrics.hits++;
    this.metrics.totalRequests++;
    this.updateMetrics();
    this.logger.debug(`Cache HIT - Response time: ${responseTime}ms`);
  }

  // Track cache miss
  recordMiss(responseTime: number) {
    this.metrics.misses++;
    this.metrics.totalRequests++;
    this.updateMetrics();
    this.logger.debug(`Cache MISS - Response time: ${responseTime}ms`);
  }

  // Get current metrics
  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  // Reset metrics
  resetMetrics() {
    this.metrics = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      averageResponseTime: 0,
      totalRequests: 0,
      lastReset: new Date(),
    };
    this.logger.log('Cache metrics reset');
  }

  // Update calculated metrics
  private updateMetrics() {
    this.metrics.hitRate =
      this.metrics.totalRequests > 0
        ? (this.metrics.hits / this.metrics.totalRequests) * 100
        : 0;
  }

  // Get Redis info for debugging
  async getRedisInfo() {
    try {
      const client = this.redisService.getClient();
      const info = await client.info();
      return info;
    } catch (error) {
      this.logger.error('Failed to get Redis info:', error);
      return null;
    }
  }

  // Get Redis memory usage
  async getMemoryUsage() {
    try {
      const client = this.redisService.getClient();
      const info = await client.info('memory');

      // Parse memory info
      const lines = info.split('\r\n');
      const memoryInfo: any = {};

      lines.forEach((line) => {
        if (line.includes(':')) {
          const [key, value] = line.split(':');
          memoryInfo[key] = value;
        }
      });

      return {
        maxMemory: memoryInfo['maxmemory'],
        usedMemory: memoryInfo['used_memory'],
        usedMemoryHuman: memoryInfo['used_memory_human'],
        maxMemoryPolicy: memoryInfo['maxmemory_policy'],
      };
    } catch (error) {
      this.logger.error('Failed to get Redis memory usage:', error);
      return null;
    }
  }

  // Get all Redis keys (for debugging)
  async getAllKeys(pattern: string = '*') {
    try {
      const client = this.redisService.getClient();
      const keys = await client.keys(pattern);
      return keys;
    } catch (error) {
      this.logger.error('Failed to get Redis keys:', error);
      return [];
    }
  }

  // Get key TTL
  async getKeyTTL(key: string) {
    try {
      const client = this.redisService.getClient();
      const ttl = await client.ttl(key);
      return ttl;
    } catch (error) {
      this.logger.error(`Failed to get TTL for key ${key}:`, error);
      return -1;
    }
  }
}
