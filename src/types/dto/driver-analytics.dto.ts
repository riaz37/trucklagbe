import { ApiProperty } from '@nestjs/swagger';
import { IsNumberString, IsOptional, IsIn } from 'class-validator';

// Validation DTOs
export class DriverIdParamDto {
  @ApiProperty({
    description: 'Driver ID',
    example: '1001',
  })
  @IsNumberString({}, { message: 'Driver ID must be a valid number' })
  driverId: string;
}

export class AnalyticsQueryDto {
  @ApiProperty({
    description: 'Use optimized query (true/false)',
    required: false,
    example: 'false',
  })
  @IsOptional()
  @IsIn(['true', 'false'], {
    message: 'Optimized must be either "true" or "false"',
  })
  optimized?: string;
}

// Response DTOs
export class TripDetailDto {
  @ApiProperty({
    description: 'Unique trip identifier',
    example: 12345,
  })
  trip_id: number;

  @ApiProperty({
    description: 'Starting location of the trip',
    example: 'Dhaka',
  })
  start_location: string;

  @ApiProperty({
    description: 'Destination of the trip',
    example: 'Chittagong',
  })
  end_location: string;

  @ApiProperty({
    description: 'Date when the trip occurred',
    example: '2024-01-15T10:00:00Z',
  })
  trip_date: Date;

  @ApiProperty({
    description: 'Amount earned from the trip',
    example: 2500,
  })
  amount: number;

  @ApiProperty({
    description: 'Rating given by the customer (1-5)',
    example: 4.5,
    minimum: 1,
    maximum: 5,
  })
  rating_value: number;

  @ApiProperty({
    description: 'Customer comment about the trip',
    example: 'Great service, very professional driver',
  })
  comment: string;
}

export class DriverAnalyticsDto {
  @ApiProperty({
    description: 'Unique driver identifier',
    example: 1001,
  })
  driver_id: number;

  @ApiProperty({
    description: 'Full name of the driver',
    example: 'Abdul Rahman',
  })
  driver_name: string;

  @ApiProperty({
    description: 'Driver contact phone number',
    example: '01712345678',
  })
  phone_number: string;

  @ApiProperty({
    description: 'Date when driver joined the platform',
    example: '2023-06-01T00:00:00Z',
  })
  onboarding_date: Date;

  @ApiProperty({
    description: 'Total number of trips completed',
    example: 45,
  })
  total_trips: number;

  @ApiProperty({
    description: 'Total earnings from all trips',
    example: 125000,
  })
  total_earnings: number;

  @ApiProperty({
    description: 'Average rating across all trips',
    example: 4.2,
    minimum: 1,
    maximum: 5,
  })
  average_rating: number;

  @ApiProperty({
    description: 'Detailed list of trips',
    type: [TripDetailDto],
  })
  trips: TripDetailDto[];
}

export class ErrorResponseDto {
  @ApiProperty({
    description: 'Error message',
    example: 'Driver not found',
  })
  message: string;

  @ApiProperty({
    description: 'HTTP status code',
    example: 404,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Error type',
    example: 'Not Found',
  })
  error: string;
}
