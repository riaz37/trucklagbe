import {
  Controller,
  Get,
  Param,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { TripAnalyticsService } from './trip-analytics.service';
import {
  DriverAnalyticsDto,
  DriverIdParamDto,
} from '../types/dto/driver-analytics.dto';
import { MonitoringService } from '../common/services/monitoring.service';

@ApiTags('trip-analytics')
@Controller('drivers')
export class TripAnalyticsController {
  constructor(
    private readonly tripAnalyticsService: TripAnalyticsService,
    private readonly monitoringService: MonitoringService,
  ) {}

  @Get(':driverId/analytics')
  @ApiOperation({
    summary: 'Get driver analytics',
    description:
      'Retrieve comprehensive analytics for a specific driver with caching',
  })
  @ApiParam({
    name: 'driverId',
    description: 'Driver ID',
    example: '1001',
  })
  @ApiResponse({
    status: 200,
    description: 'Driver analytics retrieved successfully',
    type: DriverAnalyticsDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid driver ID',
    type: Object,
  })
  @ApiResponse({
    status: 404,
    description: 'Driver not found',
    type: Object,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    type: Object,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async getDriverAnalytics(
    @Param() params: DriverIdParamDto,
  ): Promise<DriverAnalyticsDto> {
    return this.tripAnalyticsService.getDriverAnalytics(
      Number(params.driverId),
    );
  }

  @Get(':driverId/analytics/unoptimized')
  @ApiOperation({
    summary: 'Get driver analytics (Unoptimized)',
    description:
      'Retrieve driver analytics using single complex JOIN query - FOR COMPARISON ONLY',
  })
  @ApiParam({
    name: 'driverId',
    description: 'Driver ID',
    example: '1001',
  })
  @ApiResponse({
    status: 200,
    description: 'Driver analytics retrieved successfully (unoptimized)',
    type: DriverAnalyticsDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async getDriverAnalyticsUnoptimized(
    @Param() params: DriverIdParamDto,
  ): Promise<DriverAnalyticsDto> {
    return this.tripAnalyticsService.getDriverAnalyticsUnoptimized(
      Number(params.driverId),
    );
  }

  @Get('locations')
  @ApiOperation({
    summary: 'Get location-based analytics',
    description: 'Retrieve trip analytics grouped by start and end locations',
  })
  @ApiQuery({
    name: 'startDate',
    description: 'Start date (YYYY-MM-DD)',
    example: '2024-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    description: 'End date (YYYY-MM-DD)',
    example: '2024-12-31',
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number',
    required: false,
    example: '1',
  })
  @ApiQuery({
    name: 'limit',
    description: 'Items per page',
    required: false,
    example: '50',
  })
  @ApiResponse({
    status: 200,
    description: 'Location analytics retrieved successfully',
    type: Object,
  })
  async getLocationAnalytics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
  ) {
    return this.tripAnalyticsService.getLocationAnalytics(
      startDate,
      endDate,
      page,
      limit,
    );
  }

  @Get('revenue')
  @ApiOperation({
    summary: 'Get revenue analytics',
    description: 'Retrieve monthly revenue analytics',
  })
  @ApiQuery({
    name: 'startDate',
    description: 'Start date (YYYY-MM-DD)',
    example: '2024-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    description: 'End date (YYYY-MM-DD)',
    example: '2024-12-31',
  })
  @ApiResponse({
    status: 200,
    description: 'Revenue analytics retrieved successfully',
    type: Object,
  })
  async getRevenueAnalytics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.tripAnalyticsService.getRevenueAnalytics(startDate, endDate);
  }

  @Get('drivers/ranking')
  @ApiOperation({
    summary: 'Get driver performance ranking',
    description: 'Retrieve driver rankings based on performance metrics',
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of drivers to return',
    required: false,
    example: '50',
  })
  @ApiResponse({
    status: 200,
    description: 'Driver rankings retrieved successfully',
    type: Object,
  })
  async getDriverRanking(@Query('limit') limit: number = 50) {
    return this.tripAnalyticsService.getDriverRanking(limit);
  }

  @Get('cache/clear')
  @ApiOperation({
    summary: 'Clear analytics cache',
    description: 'Clear cached analytics data',
  })
  @ApiQuery({
    name: 'pattern',
    description: 'Cache key pattern to clear (e.g., "driver:*", "location:*")',
    example: 'driver:*',
  })
  @ApiResponse({
    status: 200,
    description: 'Cache cleared successfully',
    type: Object,
  })
  async clearCache(@Query('pattern') pattern: string) {
    await this.tripAnalyticsService.clearCache(pattern);
    return { message: `Cache cleared for pattern: ${pattern}` };
  }

  @Get('health')
  @ApiOperation({
    summary: 'Health check',
    description:
      'Check the health status of analytics service and dependencies',
  })
  @ApiResponse({
    status: 200,
    description: 'Health status retrieved successfully',
    type: Object,
  })
  async healthCheck() {
    return this.tripAnalyticsService.healthCheck();
  }

  @Get('performance/unoptimized')
  @ApiOperation({
    summary: 'Get unoptimized endpoint performance metrics',
    description:
      'Retrieve detailed performance metrics for the unoptimized analytics endpoint',
  })
  @ApiResponse({
    status: 200,
    description: 'Performance metrics retrieved successfully',
    type: Object,
  })
  async getUnoptimizedEndpointPerformance() {
    return this.monitoringService.getPerformanceReport();
  }

  @Get('performance/:endpoint')
  @ApiOperation({
    summary: 'Get specific endpoint performance metrics',
    description: 'Retrieve performance metrics for a specific endpoint type',
  })
  @ApiParam({
    name: 'endpoint',
    description: 'Endpoint type (optimized, unoptimized, analytics)',
    example: 'optimized',
  })
  @ApiResponse({
    status: 200,
    description: 'Endpoint performance metrics retrieved successfully',
    type: Object,
  })
  async getEndpointPerformance(
    @Param('endpoint') endpoint: string,
  ): Promise<any> {
    return this.monitoringService.getEndpointMetrics(endpoint);
  }

  @Get('performance/:endpoint/history')
  @ApiOperation({
    summary: 'Get endpoint performance history',
    description: 'Retrieve performance history logs for a specific endpoint',
  })
  @ApiParam({
    name: 'endpoint',
    description: 'Endpoint type (optimized, unoptimized, analytics)',
    example: 'optimized',
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of history entries to return',
    required: false,
    example: '100',
  })
  @ApiResponse({
    status: 200,
    description: 'Performance history retrieved successfully',
    type: Object,
  })
  async getEndpointPerformanceHistory(
    @Param('endpoint') endpoint: string,
    @Query('limit') limit: number = 100,
  ): Promise<any> {
    return this.monitoringService.getEndpointPerformanceHistory(
      endpoint,
      limit,
    );
  }
}
