import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { DriverAnalytics } from '../types/trip-analytics.types';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../database/redis.service';

@Injectable()
export class TripAnalyticsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  // Business logic methods
  validateDriverId(driverId: string): number {
    const driverIdNum = parseInt(driverId);
    if (isNaN(driverIdNum)) {
      throw new BadRequestException('Invalid driver ID');
    }
    return driverIdNum;
  }

  async ensureDriverExists(driverId: number): Promise<void> {
    // Check if driver exists using PrismaService
    const driver = await this.prismaService.getDriverById(driverId);

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }
  }

  // Main analytics methods
  async getDriverAnalytics(
    driverId: string,
    optimized: string = 'false',
  ): Promise<DriverAnalytics> {
    const driverIdNum = this.validateDriverId(driverId);
    await this.ensureDriverExists(driverIdNum);

    if (optimized === 'true') {
      return this.executeOptimizedQuery(driverIdNum);
    } else {
      return this.executeUnoptimizedQuery(driverIdNum);
    }
  }

  async getDriverAnalyticsUnoptimized(
    driverId: string,
  ): Promise<DriverAnalytics> {
    const driverIdNum = this.validateDriverId(driverId);
    await this.ensureDriverExists(driverIdNum);

    return this.executeUnoptimizedQuery(driverIdNum);
  }

  async getDriverAnalyticsOptimized(
    driverId: string,
  ): Promise<DriverAnalytics> {
    const driverIdNum = this.validateDriverId(driverId);
    await this.ensureDriverExists(driverIdNum);

    return this.executeOptimizedQuery(driverIdNum);
  }

  async getDriverAnalyticsCached(driverId: string): Promise<DriverAnalytics> {
    const driverIdNum = this.validateDriverId(driverId);
    await this.ensureDriverExists(driverIdNum);

    return this.executeCachedQuery(driverIdNum);
  }

  // Private implementation methods with actual business logic
  private async executeUnoptimizedQuery(
    driverId: number,
  ): Promise<DriverAnalytics> {
    // Get driver with all relations using PrismaService
    const result = await this.prismaService.getDriverWithRelations(driverId);

    if (!result) {
      throw new NotFoundException('Driver not found');
    }

    // Calculate total earnings
    const totalEarnings = result.trips.reduce(
      (sum, trip) => sum + (trip.payment ? Number(trip.payment.amount) : 0),
      0,
    );

    // Calculate average rating
    const totalRatings = result.trips.filter((trip) => trip.rating).length;
    const averageRating =
      totalRatings > 0
        ? result.trips.reduce(
            (sum, trip) =>
              sum + (trip.rating ? Number(trip.rating.rating_value) : 0),
            0,
          ) / totalRatings
        : 0;

    // Map trip details
    const trips = result.trips.map((trip) => ({
      trip_id: trip.id,
      start_location: trip.start_location,
      end_location: trip.end_location,
      trip_date: trip.trip_date,
      amount: trip.payment ? Number(trip.payment.amount) : 0,
      rating_value: trip.rating ? Number(trip.rating.rating_value) : 0,
      comment: trip.rating ? trip.rating.comment || '' : '',
    }));

    return {
      driver_id: result.id,
      driver_name: result.driver_name,
      phone_number: result.phone_number,
      onboarding_date: result.onboarding_date,
      total_trips: result.trips.length,
      total_earnings: totalEarnings,
      average_rating: averageRating,
      trips,
    };
  }

  private async executeOptimizedQuery(
    driverId: number,
  ): Promise<DriverAnalytics> {
    // Get raw data using PrismaService methods
    const [driver, trips] = await Promise.all([
      this.prismaService.getDriverById(driverId),
      this.prismaService.getTripsByDriverId(driverId),
    ]);

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    // If no trips, return early with empty data
    if (trips.length === 0) {
      return {
        driver_id: driver.id,
        driver_name: driver.driver_name,
        phone_number: driver.phone_number,
        onboarding_date: driver.onboarding_date,
        total_trips: 0,
        total_earnings: 0,
        average_rating: 0,
        trips: [],
      };
    }

    const tripIds = trips.map((t) => t.id);

    // Get related data in parallel using PrismaService methods
    const [payments, ratings] = await Promise.all([
      this.prismaService.getPaymentsByTripIds(tripIds),
      this.prismaService.getRatingsByTripIds(tripIds),
    ]);

    // Create lookup maps for O(1) access with proper typing
    const paymentMap = new Map(
      payments.map((p) => [p.trip_id, Number(p.amount)]),
    );

    interface RatingData {
      value: number;
      comment: string | null;
    }

    const ratingMap = new Map<number, RatingData>(
      ratings.map((r) => [
        r.trip_id,
        { value: Number(r.rating_value), comment: r.comment },
      ]),
    );

    // Combine the data efficiently
    const tripDetails = trips.map((trip) => {
      const ratingData = ratingMap.get(trip.id);
      return {
        trip_id: trip.id,
        start_location: trip.start_location,
        end_location: trip.end_location,
        trip_date: trip.trip_date,
        amount: paymentMap.get(trip.id) || 0,
        rating_value: ratingData?.value || 0,
        comment: ratingData?.comment || '',
      };
    });

    // Calculate totals efficiently
    const totalEarnings = tripDetails.reduce(
      (sum, trip) => sum + trip.amount,
      0,
    );
    const validRatings = tripDetails.filter((trip) => trip.rating_value > 0);
    const averageRating =
      validRatings.length > 0
        ? validRatings.reduce((sum, trip) => sum + trip.rating_value, 0) /
          validRatings.length
        : 0;

    return {
      driver_id: driver.id,
      driver_name: driver.driver_name,
      phone_number: driver.phone_number,
      onboarding_date: driver.onboarding_date,
      total_trips: trips.length,
      total_earnings: totalEarnings,
      average_rating: averageRating,
      trips: tripDetails,
    };
  }

  private async executeCachedQuery(driverId: number): Promise<DriverAnalytics> {
    try {
      // Try to get from cache first using PrismaService
      const cached =
        await this.prismaService.getCachedAnalytics<DriverAnalytics>(driverId);

      if (cached) {
        console.log(`✅ Cache HIT for driver ${driverId}`);
        return cached;
      }

      console.log(`❌ Cache MISS for driver ${driverId}, calculating...`);

      // If not in cache, calculate using optimized query and cache
      const result = await this.executeOptimizedQuery(driverId);

      // Cache the result using PrismaService
      await this.prismaService.setCachedAnalytics(driverId, result);
      console.log(`💾 Cached driver ${driverId} analytics`);

      return result;
    } catch (error) {
      console.error(`Error in cached analytics for driver ${driverId}:`, error);
      // Fallback to direct calculation if caching fails
      return await this.executeOptimizedQuery(driverId);
    }
  }
}
