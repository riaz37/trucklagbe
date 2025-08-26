import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../database/redis.service';

interface EndpointMetrics {
  endpoint: string;
  totalRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  slowRequestCount: number;
  errorCount: number;
  lastRequestTime: string;
  performanceTrend: 'improving' | 'degrading' | 'stable';
  cacheHitRate?: number;
  cacheMissRate?: number;
}

interface PerformanceLog {
  timestamp: string;
  endpoint: string;
  url: string;
  method: string;
  driverId?: string;
  responseTimeMs: number;
  performanceCategory: string;
  status: 'success' | 'error';
  isCached?: boolean;
  error?: string;
}

@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);

  constructor(private readonly redisService: RedisService) {}

  async recordEndpointRequest(
    endpoint: string,
    url: string,
    method: string,
    responseTime: number,
    driverId?: string,
    isError: boolean = false,
    isCached: boolean = false,
    error?: string,
  ): Promise<void> {
    try {
      // Record detailed performance log
      await this.recordPerformanceLog(
        endpoint,
        url,
        method,
        responseTime,
        driverId,
        isError,
        isCached,
        error,
      );

      // Update endpoint metrics
      await this.updateEndpointMetrics(
        endpoint,
        responseTime,
        isError,
        isCached,
      );

      // Log performance warnings
      this.logPerformanceWarnings(endpoint, responseTime, url, driverId);
    } catch (error) {
      this.logger.error(
        `Failed to record endpoint request for ${endpoint}:`,
        error,
      );
    }
  }

  async getEndpointMetrics(endpoint: string): Promise<EndpointMetrics> {
    try {
      const key = `endpoint:${endpoint}:metrics`;
      const metrics = await this.redisService.get<EndpointMetrics>(key);

      if (!metrics) {
        return {
          endpoint,
          totalRequests: 0,
          averageResponseTime: 0,
          minResponseTime: 0,
          maxResponseTime: 0,
          slowRequestCount: 0,
          errorCount: 0,
          lastRequestTime: 'Never',
          performanceTrend: 'stable',
          cacheHitRate: 0,
          cacheMissRate: 0,
        };
      }

      return metrics;
    } catch (error) {
      this.logger.error(
        `Failed to get endpoint metrics for ${endpoint}:`,
        error,
      );
      throw error;
    }
  }

  async getPerformanceReport(): Promise<any> {
    try {
      const [cachedAnalyticsMetrics, complexQueryMetrics] = await Promise.all([
        this.getEndpointMetrics('cached-analytics'),
        this.getEndpointMetrics('complex-query'),
      ]);

      const report = {
        timestamp: new Date().toISOString(),
        endpoints: {
          'cached-analytics': {
            ...cachedAnalyticsMetrics,
            performanceScore: this.calculatePerformanceScore(
              cachedAnalyticsMetrics,
            ),
            recommendations: this.generateRecommendations(
              cachedAnalyticsMetrics,
              'cached-analytics',
            ),
          },
          'complex-query': {
            ...complexQueryMetrics,
            performanceScore:
              this.calculatePerformanceScore(complexQueryMetrics),
            recommendations: this.generateRecommendations(
              complexQueryMetrics,
              'complex-query',
            ),
          },
        },
        summary: {
          totalEndpoints: 2,
          criticalIssues: this.countCriticalIssues([
            cachedAnalyticsMetrics,
            complexQueryMetrics,
          ]),
          optimizationNeeded: this.needsOptimization([
            cachedAnalyticsMetrics,
            complexQueryMetrics,
          ]),
          performanceComparison: this.comparePerformance(
            cachedAnalyticsMetrics,
            complexQueryMetrics,
          ),
        },
      };

      return report;
    } catch (error) {
      this.logger.error('Failed to generate performance report:', error);
      throw error;
    }
  }

  async getEndpointPerformanceHistory(
    endpoint: string,
    limit: number = 100,
  ): Promise<PerformanceLog[]> {
    try {
      const key = `endpoint:${endpoint}:logs`;
      const logs = (await this.redisService.get<PerformanceLog[]>(key)) || [];
      return logs.slice(-limit);
    } catch (error) {
      this.logger.error(
        `Failed to get performance history for ${endpoint}:`,
        error,
      );
      return [];
    }
  }

  private async recordPerformanceLog(
    endpoint: string,
    url: string,
    method: string,
    responseTime: number,
    driverId?: string,
    isError: boolean = false,
    isCached: boolean = false,
    error?: string,
  ): Promise<void> {
    const timestamp = new Date().toISOString();
    const performanceCategory = this.categorizePerformance(responseTime);

    const log: PerformanceLog = {
      timestamp,
      endpoint,
      url,
      method,
      driverId,
      responseTimeMs: responseTime,
      performanceCategory,
      status: isError ? 'error' : 'success',
      isCached,
      error,
    };

    // Store log in Redis with 24 hour TTL
    const logKey = `endpoint:${endpoint}:logs`;
    const logs = (await this.redisService.get<PerformanceLog[]>(logKey)) || [];
    logs.push(log);

    // Keep only last 1000 logs
    if (logs.length > 1000) {
      logs.splice(0, logs.length - 1000);
    }

    await this.redisService.set(logKey, logs, 86400);
  }

  private async updateEndpointMetrics(
    endpoint: string,
    responseTime: number,
    isError: boolean,
    isCached: boolean,
  ): Promise<void> {
    const key = `endpoint:${endpoint}:metrics`;
    const currentMetrics = await this.getEndpointMetrics(endpoint);

    const newMetrics: EndpointMetrics = {
      endpoint,
      totalRequests: currentMetrics.totalRequests + 1,
      averageResponseTime: this.calculateNewAverage(
        currentMetrics.averageResponseTime,
        currentMetrics.totalRequests,
        responseTime,
      ),
      minResponseTime: Math.min(
        currentMetrics.minResponseTime || responseTime,
        responseTime,
      ),
      maxResponseTime: Math.max(
        currentMetrics.maxResponseTime || responseTime,
        responseTime,
      ),
      slowRequestCount:
        currentMetrics.slowRequestCount + (responseTime > 1000 ? 1 : 0),
      errorCount: currentMetrics.errorCount + (isError ? 1 : 0),
      lastRequestTime: new Date().toISOString(),
      performanceTrend: this.calculatePerformanceTrend(
        currentMetrics,
        responseTime,
      ),
      cacheHitRate: this.calculateCacheHitRate(currentMetrics, isCached),
      cacheMissRate: this.calculateCacheMissRate(currentMetrics, isCached),
    };

    await this.redisService.set(key, newMetrics, 86400);
  }

  private categorizePerformance(responseTime: number): string {
    if (responseTime > 5000) return 'CRITICAL';
    if (responseTime > 2000) return 'POOR';
    if (responseTime > 1000) return 'SLOW';
    if (responseTime > 500) return 'MODERATE';
    if (responseTime > 200) return 'GOOD';
    return 'EXCELLENT';
  }

  private calculateNewAverage(
    currentAvg: number,
    currentCount: number,
    newValue: number,
  ): number {
    if (currentCount === 0) return newValue;
    return (currentAvg * currentCount + newValue) / (currentCount + 1);
  }

  private calculatePerformanceTrend(
    currentMetrics: EndpointMetrics,
    newResponseTime: number,
  ): 'improving' | 'degrading' | 'stable' {
    if (currentMetrics.totalRequests < 2) return 'stable';

    const threshold = 0.1; // 10% change threshold
    const change =
      Math.abs(newResponseTime - currentMetrics.averageResponseTime) /
      currentMetrics.averageResponseTime;

    if (change < threshold) return 'stable';
    return newResponseTime < currentMetrics.averageResponseTime
      ? 'improving'
      : 'degrading';
  }

  private calculateCacheHitRate(
    currentMetrics: EndpointMetrics,
    isCached: boolean,
  ): number {
    const totalRequests = currentMetrics.totalRequests;
    if (totalRequests === 0) return 0;

    const currentHitRate = currentMetrics.cacheHitRate || 0;
    const currentHits = Math.round(currentHitRate * totalRequests);
    const newHits = currentHits + (isCached ? 1 : 0);

    return newHits / (totalRequests + 1);
  }

  private calculateCacheMissRate(
    currentMetrics: EndpointMetrics,
    isCached: boolean,
  ): number {
    return 1 - this.calculateCacheHitRate(currentMetrics, isCached);
  }

  private calculatePerformanceScore(metrics: EndpointMetrics): number {
    let score = 100;

    // Deduct points for slow responses
    if (metrics.averageResponseTime > 5000) score -= 40;
    else if (metrics.averageResponseTime > 2000) score -= 25;
    else if (metrics.averageResponseTime > 1000) score -= 15;
    else if (metrics.averageResponseTime > 500) score -= 5;

    // Deduct points for errors
    if (metrics.errorCount > 0) {
      const errorRate = metrics.errorCount / metrics.totalRequests;
      score -= Math.min(30, errorRate * 100);
    }

    // Deduct points for slow request percentage
    if (metrics.slowRequestCount > 0) {
      const slowRate = metrics.slowRequestCount / metrics.totalRequests;
      score -= Math.min(20, slowRate * 100);
    }

    // Bonus points for good cache hit rate (for optimized endpoint)
    if (metrics.cacheHitRate && metrics.cacheHitRate > 0.8) {
      score += 10;
    }

    return Math.max(0, Math.round(score));
  }

  private generateRecommendations(
    metrics: EndpointMetrics,
    endpointType: string,
  ): string[] {
    const recommendations: string[] = [];

    if (metrics.averageResponseTime > 2000) {
      recommendations.push(
        'CRITICAL: Response time is extremely slow. Consider database query optimization, indexing, or caching.',
      );
    } else if (metrics.averageResponseTime > 1000) {
      recommendations.push(
        'HIGH: Response time is slow. Review database queries and consider adding database indexes.',
      );
    } else if (metrics.averageResponseTime > 500) {
      recommendations.push(
        'MEDIUM: Response time could be improved. Consider query optimization or caching strategies.',
      );
    }

    if (metrics.errorCount > 0) {
      recommendations.push(
        'Review error logs and implement proper error handling and validation.',
      );
    }

    if (metrics.slowRequestCount / metrics.totalRequests > 0.1) {
      recommendations.push(
        'More than 10% of requests are slow. Implement monitoring and alerting for performance issues.',
      );
    }

    if (endpointType === 'unoptimized' && metrics.averageResponseTime > 1000) {
      recommendations.push(
        'This endpoint is unoptimized. Consider implementing the optimized version with caching and query optimization.',
      );
    }

    if (
      endpointType === 'optimized' &&
      metrics.cacheHitRate &&
      metrics.cacheHitRate < 0.5
    ) {
      recommendations.push(
        'Cache hit rate is low. Review caching strategy and cache invalidation logic.',
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        'Performance is within acceptable limits. Continue monitoring.',
      );
    }

    return recommendations;
  }

  private countCriticalIssues(metrics: EndpointMetrics[]): number {
    return metrics.filter((m) => m.averageResponseTime > 2000).length;
  }

  private needsOptimization(metrics: EndpointMetrics[]): boolean {
    return metrics.some((m) => m.averageResponseTime > 1000);
  }

  private comparePerformance(
    optimized: EndpointMetrics,
    unoptimized: EndpointMetrics,
  ): any {
    if (optimized.totalRequests === 0 || unoptimized.totalRequests === 0) {
      return { message: 'Insufficient data for comparison' };
    }

    const responseTimeImprovement =
      ((unoptimized.averageResponseTime - optimized.averageResponseTime) /
        unoptimized.averageResponseTime) *
      100;
    const errorRateComparison = {
      optimized: optimized.errorCount / optimized.totalRequests,
      unoptimized: unoptimized.errorCount / unoptimized.totalRequests,
    };

    return {
      responseTimeImprovement: `${responseTimeImprovement.toFixed(2)}%`,
      isOptimizedFaster:
        optimized.averageResponseTime < unoptimized.averageResponseTime,
      errorRateComparison,
      recommendation:
        responseTimeImprovement > 20
          ? 'Optimized endpoint shows significant improvement'
          : 'Consider further optimization',
    };
  }

  private logPerformanceWarnings(
    endpoint: string,
    responseTime: number,
    url: string,
    driverId?: string,
  ): void {
    if (responseTime > 5000) {
      this.logger.error(
        `🚨 CRITICAL PERFORMANCE: ${endpoint} endpoint took ${responseTime.toFixed(2)}ms - URL: ${url}${driverId ? ` - Driver: ${driverId}` : ''}`,
      );
    } else if (responseTime > 2000) {
      this.logger.warn(
        `⚠️  POOR PERFORMANCE: ${endpoint} endpoint took ${responseTime.toFixed(2)}ms - URL: ${url}${driverId ? ` - Driver: ${driverId}` : ''}`,
      );
    } else if (responseTime > 1000) {
      this.logger.warn(
        `⚠️  SLOW PERFORMANCE: ${endpoint} endpoint took ${responseTime.toFixed(2)}ms - URL: ${url}${driverId ? ` - Driver: ${driverId}` : ''}`,
      );
    }
  }
}
