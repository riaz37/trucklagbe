import { Injectable } from '@nestjs/common';
import { TripAnalyticsService } from '../trip-analytics/trip-analytics.service';

export interface PerformanceMetrics {
  endpoint: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  requestsPerSecond: number;
  totalTime: number;
}

@Injectable()
export class PerformanceTestService {
  constructor(private readonly tripAnalyticsService: TripAnalyticsService) {}

  async benchmarkEndpoints(
    driverId: number,
    totalRequests: number = 100,
    concurrency: number = 10,
  ): Promise<{
    unoptimized: PerformanceMetrics;
    optimized: PerformanceMetrics;
  }> {
    console.log(`Starting performance benchmark for driver ${driverId}`);
    console.log(
      `Total requests: ${totalRequests}, Concurrency: ${concurrency}`,
    );

    const unoptimizedMetrics = await this.benchmarkEndpoint(
      'unoptimized',
      driverId,
      totalRequests,
      concurrency,
      () => this.tripAnalyticsService.getDriverAnalyticsUnoptimized(driverId),
    );

    const optimizedMetrics = await this.benchmarkEndpoint(
      'optimized',
      driverId,
      totalRequests,
      concurrency,
      () => this.tripAnalyticsService.getDriverAnalyticsOptimized(driverId),
    );

    return { unoptimized: unoptimizedMetrics, optimized: optimizedMetrics };
  }

  private async benchmarkEndpoint(
    endpointName: string,
    driverId: number,
    totalRequests: number,
    concurrency: number,
    requestFn: () => Promise<any>,
  ): Promise<PerformanceMetrics> {
    console.log(`\nBenchmarking ${endpointName} endpoint...`);

    const startTime = Date.now();
    const responseTimes: number[] = [];
    let successfulRequests = 0;
    let failedRequests = 0;

    // Create batches of concurrent requests
    const batches = Math.ceil(totalRequests / concurrency);

    for (let batch = 0; batch < batches; batch++) {
      const batchSize = Math.min(
        concurrency,
        totalRequests - batch * concurrency,
      );
      const batchPromises = Array(batchSize)
        .fill(0)
        .map(async () => {
          const requestStart = Date.now();
          try {
            await requestFn();
            const responseTime = Date.now() - requestStart;
            responseTimes.push(responseTime);
            successfulRequests++;
          } catch (error) {
            failedRequests++;
            console.error(`Request failed: ${error.message}`);
          }
        });

      await Promise.all(batchPromises);

      // Progress indicator
      const progress = (((batch + 1) * concurrency) / totalRequests) * 100;
      console.log(`Progress: ${Math.min(progress, 100).toFixed(1)}%`);
    }

    const totalTime = Date.now() - startTime;
    const sortedResponseTimes = responseTimes.sort((a, b) => a - b);

    const metrics: PerformanceMetrics = {
      endpoint: endpointName,
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime:
        responseTimes.reduce((sum, time) => sum + time, 0) /
        responseTimes.length,
      minResponseTime: sortedResponseTimes[0] || 0,
      maxResponseTime: sortedResponseTimes[sortedResponseTimes.length - 1] || 0,
      p95ResponseTime: this.calculatePercentile(sortedResponseTimes, 95),
      p99ResponseTime: this.calculatePercentile(sortedResponseTimes, 99),
      requestsPerSecond: (successfulRequests / totalTime) * 1000,
      totalTime,
    };

    this.printMetrics(metrics);
    return metrics;
  }

  private calculatePercentile(
    sortedArray: number[],
    percentile: number,
  ): number {
    if (sortedArray.length === 0) return 0;
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, index)];
  }

  private printMetrics(metrics: PerformanceMetrics): void {
    console.log(`\n📊 Performance Metrics for ${metrics.endpoint} endpoint:`);
    console.log(`   Total Requests: ${metrics.totalRequests}`);
    console.log(`   Successful: ${metrics.successfulRequests}`);
    console.log(`   Failed: ${metrics.failedRequests}`);
    console.log(
      `   Success Rate: ${((metrics.successfulRequests / metrics.totalRequests) * 100).toFixed(2)}%`,
    );
    console.log(`   Total Time: ${metrics.totalTime}ms`);
    console.log(`   Requests/Second: ${metrics.requestsPerSecond.toFixed(2)}`);
    console.log(`   Response Times:`);
    console.log(`     Average: ${metrics.averageResponseTime.toFixed(2)}ms`);
    console.log(`     Min: ${metrics.minResponseTime}ms`);
    console.log(`     Max: ${metrics.maxResponseTime}ms`);
    console.log(`     P95: ${metrics.p95ResponseTime}ms`);
    console.log(`     P99: ${metrics.p99ResponseTime}ms`);
  }

  async comparePerformance(
    driverId: number,
    totalRequests: number = 100,
    concurrency: number = 10,
  ): Promise<void> {
    const results = await this.benchmarkEndpoints(
      driverId,
      totalRequests,
      concurrency,
    );

    console.log('\n🚀 PERFORMANCE COMPARISON SUMMARY');
    console.log('=====================================');

    const unopt = results.unoptimized;
    const opt = results.optimized;

    console.log(`\n📈 Throughput Comparison:`);
    console.log(`   Unoptimized: ${unopt.requestsPerSecond.toFixed(2)} RPS`);
    console.log(`   Optimized:   ${opt.requestsPerSecond.toFixed(2)} RPS`);
    console.log(
      `   Improvement: ${((opt.requestsPerSecond / unopt.requestsPerSecond - 1) * 100).toFixed(2)}%`,
    );

    console.log(`\n⏱️  Response Time Comparison:`);
    console.log(`   Unoptimized P95: ${unopt.p95ResponseTime}ms`);
    console.log(`   Optimized P95:   ${opt.p95ResponseTime}ms`);
    console.log(
      `   Improvement:     ${((unopt.p95ResponseTime / opt.p95ResponseTime - 1) * 100).toFixed(2)}%`,
    );

    console.log(`\n✅ Reliability Comparison:`);
    console.log(
      `   Unoptimized Success Rate: ${((unopt.successfulRequests / unopt.totalRequests) * 100).toFixed(2)}%`,
    );
    console.log(
      `   Optimized Success Rate:   ${((opt.successfulRequests / opt.totalRequests) * 100).toFixed(2)}%`,
    );

    if (opt.requestsPerSecond > unopt.requestsPerSecond) {
      console.log(`\n🎉 The optimized endpoint performs better!`);
    } else {
      console.log(
        `\n⚠️  The unoptimized endpoint performs better (this might indicate an issue)`,
      );
    }
  }
}
