import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MonitoringService } from '../services/monitoring.service';

@Injectable()
export class PerformanceMonitoringInterceptor implements NestInterceptor {
  private readonly logger = new Logger(PerformanceMonitoringInterceptor.name);

  constructor(private readonly monitoringService: MonitoringService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const startTime = process.hrtime.bigint();
    const url = request.url;
    const method = request.method;
    const driverId = request.params?.driverId;

    // Determine endpoint type based on URL
    const endpoint = this.determineEndpointType(url);

    this.logger.debug(
      `Request started: ${method} ${url} - Endpoint: ${endpoint}${driverId ? ` - Driver ID: ${driverId}` : ''}`,
    );

    return next.handle().pipe(
      tap({
        next: async () => {
          const endTime = process.hrtime.bigint();
          const responseTimeMs = Number(endTime - startTime) / 1000000; // Convert nanoseconds to milliseconds

          this.logger.debug(
            `Request completed: ${method} ${url} - Response Time: ${responseTimeMs.toFixed(2)}ms`,
          );

          // Record metrics in monitoring service
          await this.monitoringService.recordEndpointRequest(
            endpoint,
            url,
            method,
            responseTimeMs,
            driverId,
            false, // isError
          );
        },
        error: async (error) => {
          const endTime = process.hrtime.bigint();
          const responseTimeMs = Number(endTime - startTime) / 1000000;

          this.logger.error(
            `Request failed: ${method} ${url} - Response Time: ${responseTimeMs.toFixed(2)}ms - Error: ${error.message}`,
          );

          // Record error metrics in monitoring service
          await this.monitoringService.recordEndpointRequest(
            endpoint,
            url,
            method,
            responseTimeMs,
            driverId,
            true, // isError
            error.message, // error
          );
        },
      }),
    );
  }

  private determineEndpointType(url: string): string {
    if (url.includes('/unoptimized')) {
      return 'unoptimized';
    } else if (url.includes('/analytics') && !url.includes('/unoptimized')) {
      return 'optimized';
    } else if (
      url.includes('/locations') ||
      url.includes('/revenue') ||
      url.includes('/ranking')
    ) {
      return 'analytics';
    } else {
      return 'other';
    }
  }
}
