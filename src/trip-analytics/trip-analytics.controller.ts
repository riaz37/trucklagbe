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
import { DriverAnalytics } from '../types/trip-analytics.types';
import {
  DriverAnalyticsDto,
  ErrorResponseDto,
  DriverIdParamDto,
  AnalyticsQueryDto,
} from '../types/dto/driver-analytics.dto';

@ApiTags('drivers')
@Controller('api/v1/drivers')
export class TripAnalyticsController {
  constructor(private readonly tripAnalyticsService: TripAnalyticsService) {}

  @Get(':driverId/analytics')
  @ApiOperation({
    summary: 'Get driver analytics',
    description:
      'Retrieve comprehensive analytics for a specific driver with optional optimization',
  })
  @ApiParam({
    name: 'driverId',
    description: 'Driver ID',
    example: '1001',
  })
  @ApiQuery({
    name: 'optimized',
    description: 'Use optimized query (true/false)',
    required: false,
    example: 'false',
  })
  @ApiResponse({
    status: 200,
    description: 'Driver analytics retrieved successfully',
    type: DriverAnalyticsDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid driver ID',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Driver not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    type: ErrorResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async getDriverAnalytics(
    @Param() params: DriverIdParamDto,
    @Query() query: AnalyticsQueryDto,
  ): Promise<DriverAnalytics> {
    return this.tripAnalyticsService.getDriverAnalytics(
      params.driverId,
      query.optimized,
    );
  }

  @Get(':driverId/analytics/unoptimized')
  @ApiOperation({
    summary: 'Get driver analytics (unoptimized)',
    description: 'Retrieve driver analytics using unoptimized database queries',
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
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Driver not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    type: ErrorResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async getDriverAnalyticsUnoptimized(
    @Param() params: DriverIdParamDto,
  ): Promise<DriverAnalytics> {
    return this.tripAnalyticsService.getDriverAnalyticsUnoptimized(
      params.driverId,
    );
  }

  @Get(':driverId/analytics/optimized')
  @ApiOperation({
    summary: 'Get driver analytics (optimized)',
    description: 'Retrieve driver analytics using optimized database queries',
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
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Driver not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    type: ErrorResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async getDriverAnalyticsOptimized(
    @Param() params: DriverIdParamDto,
  ): Promise<DriverAnalytics> {
    return this.tripAnalyticsService.getDriverAnalyticsOptimized(
      params.driverId,
    );
  }

  @Get(':driverId/analytics/cached')
  @ApiOperation({
    summary: 'Get driver analytics (cached)',
    description:
      'Retrieve driver analytics from cache for improved performance',
  })
  @ApiParam({
    name: 'driverId',
    description: 'Driver ID',
    example: '1001',
  })
  @ApiResponse({
    status: 200,
    description: 'Driver analytics retrieved successfully from cache',
    type: DriverAnalyticsDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid driver ID',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Driver not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    type: ErrorResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async getDriverAnalyticsCached(
    @Param() params: DriverIdParamDto,
  ): Promise<DriverAnalytics> {
    return this.tripAnalyticsService.getDriverAnalyticsCached(params.driverId);
  }
}
