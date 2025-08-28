import { Injectable, Logger } from '@nestjs/common';

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
  error?: string;
}

@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);

  // In-memory storage for metrics and logs
  private endpointMetrics = new Map<string, EndpointMetrics>();
  private performanceLogs: PerformanceLog[] = [];
  private readonly maxLogs = 10000; // Keep last 10k logs

  constructor() {}

  async recordEndpointRequest(
    endpoint: string,
    url: string,
    method: string,
    responseTime: number,
    driverId?: string,
    isError: boolean = false,
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
        error,
      );

      // Update endpoint metrics
      await this.updateEndpointMetrics(
        endpoint,
        responseTime,
        isError,
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
      const metrics = this.endpointMetrics.get(endpoint);

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
        };
      }

      return metrics;
    } catch (error) {
      this.logger.error(`Failed to get metrics for ${endpoint}:`, error);
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
      };
    }
  }

  async getAllEndpointMetrics(): Promise<EndpointMetrics[]> {
    try {
      return Array.from(this.endpointMetrics.values());
    } catch (error) {
      this.logger.error('Failed to get all endpoint metrics:', error);
      return [];
    }
  }

  async getPerformanceReport(): Promise<any> {
    try {
      const allMetrics = await this.getAllEndpointMetrics();
      const totalRequests = allMetrics.reduce((sum, m) => sum + m.totalRequests, 0);
      const totalErrors = allMetrics.reduce((sum, m) => sum + m.errorCount, 0);
      const avgResponseTime = allMetrics.reduce((sum, m) => sum + m.averageResponseTime, 0) / Math.max(allMetrics.length, 1);

      return {
        summary: {
          totalEndpoints: allMetrics.length,
          totalRequests,
          totalErrors,
          errorRate: totalRequests > 0 ? (totalErrors / totalRequests * 100).toFixed(2) + '%' : '0%',
          averageResponseTime: avgResponseTime.toFixed(2) + 'ms',
        },
        endpoints: allMetrics,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to generate performance report:', error);
      return {
        summary: {
          totalEndpoints: 0,
          totalRequests: 0,
          totalErrors: 0,
          errorRate: '0%',
          averageResponseTime: '0ms',
        },
        endpoints: [],
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }
  }

  async getEndpointPerformanceHistory(
    endpoint: string,
    limit: number = 100,
  ): Promise<PerformanceLog[]> {
    try {
      return this.performanceLogs
        .filter(log => log.endpoint === endpoint)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
    } catch (error) {
      this.logger.error(`Failed to get performance history for ${endpoint}:`, error);
      return [];
    }
  }

  async clearMetrics(endpoint?: string): Promise<void> {
    try {
      if (endpoint) {
        this.endpointMetrics.delete(endpoint);
        this.performanceLogs = this.performanceLogs.filter(log => log.endpoint !== endpoint);
        this.logger.log(`Metrics cleared for endpoint: ${endpoint}`);
      } else {
        this.endpointMetrics.clear();
        this.performanceLogs = [];
        this.logger.log('All metrics cleared');
      }
    } catch (error) {
      this.logger.error('Failed to clear metrics:', error);
    }
  }

  private async recordPerformanceLog(
    endpoint: string,
    url: string,
    method: string,
    responseTime: number,
    driverId?: string,
    isError: boolean = false,
    error?: string,
  ): Promise<void> {
    try {
    const log: PerformanceLog = {
        timestamp: new Date().toISOString(),
      endpoint,
      url,
      method,
      driverId,
      responseTimeMs: responseTime,
        performanceCategory: this.categorizePerformance(responseTime),
      status: isError ? 'error' : 'success',
      error,
    };

      this.performanceLogs.push(log);

      // Keep only the last maxLogs entries
      if (this.performanceLogs.length > this.maxLogs) {
        this.performanceLogs = this.performanceLogs.slice(-this.maxLogs);
      }
    } catch (error) {
      this.logger.error('Failed to record performance log:', error);
    }
  }

  private async updateEndpointMetrics(
    endpoint: string,
    responseTime: number,
    isError: boolean,
  ): Promise<void> {
    try {
      const existing = this.endpointMetrics.get(endpoint);
      const now = new Date().toISOString();

      if (!existing) {
        // Create new metrics
        this.endpointMetrics.set(endpoint, {
      endpoint,
          totalRequests: 1,
          averageResponseTime: responseTime,
          minResponseTime: responseTime,
          maxResponseTime: responseTime,
          slowRequestCount: responseTime > 1000 ? 1 : 0,
          errorCount: isError ? 1 : 0,
          lastRequestTime: now,
          performanceTrend: 'stable',
        });
        return;
      }

      // Update existing metrics
      const totalRequests = existing.totalRequests + 1;
      const totalResponseTime = existing.averageResponseTime * existing.totalRequests + responseTime;
      const averageResponseTime = totalResponseTime / totalRequests;
      const minResponseTime = Math.min(existing.minResponseTime, responseTime);
      const maxResponseTime = Math.max(existing.maxResponseTime, responseTime);
      const slowRequestCount = existing.slowRequestCount + (responseTime > 1000 ? 1 : 0);
      const errorCount = existing.errorCount + (isError ? 1 : 0);

      // Calculate performance trend
      const performanceTrend = this.calculatePerformanceTrend(
        existing.averageResponseTime,
        averageResponseTime,
      );

      this.endpointMetrics.set(endpoint, {
        endpoint,
        totalRequests,
        averageResponseTime,
        minResponseTime,
        maxResponseTime,
        slowRequestCount,
        errorCount,
        lastRequestTime: now,
        performanceTrend,
      });
    } catch (error) {
      this.logger.error(`Failed to update metrics for ${endpoint}:`, error);
    }
  }

  private categorizePerformance(responseTime: number): string {
    if (responseTime < 100) return 'excellent';
    if (responseTime < 500) return 'good';
    if (responseTime < 1000) return 'acceptable';
    if (responseTime < 3000) return 'slow';
    return 'very_slow';
  }

  private calculatePerformanceTrend(
    oldAverage: number,
    newAverage: number,
  ): 'improving' | 'degrading' | 'stable' {
    const threshold = 0.1; // 10% change threshold
    const change = Math.abs(newAverage - oldAverage) / oldAverage;

    if (change < threshold) return 'stable';
    return newAverage < oldAverage ? 'improving' : 'degrading';
  }

  private logPerformanceWarnings(
    endpoint: string,
    responseTime: number,
    url: string,
    driverId?: string,
  ): void {
    if (responseTime > 2000) {
      this.logger.warn(
        `Slow endpoint detected: ${endpoint} took ${responseTime}ms - URL: ${url}${driverId ? `, Driver: ${driverId}` : ''}`,
      );
    }

    if (responseTime > 5000) {
      this.logger.error(
        `Very slow endpoint detected: ${endpoint} took ${responseTime}ms - URL: ${url}${driverId ? `, Driver: ${driverId}` : ''}`,
      );
    }
  }

  // Health check method
  async healthCheck(): Promise<any> {
    try {
      const allMetrics = await this.getAllEndpointMetrics();
      const totalRequests = allMetrics.reduce((sum, m) => sum + m.totalRequests, 0);
      const totalErrors = allMetrics.reduce((sum, m) => sum + m.errorCount, 0);

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        metrics: {
          totalEndpoints: allMetrics.length,
          totalRequests,
          totalErrors,
          errorRate: totalRequests > 0 ? (totalErrors / totalRequests * 100).toFixed(2) + '%' : '0%',
        },
        memory: {
          logsStored: this.performanceLogs.length,
          maxLogs: this.maxLogs,
        },
      };
    } catch (error) {
      this.logger.error('Health check failed:', error);
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }
  }
}
