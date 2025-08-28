import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { DriverAnalyticsDto } from '../types/dto/driver-analytics.dto';

@Injectable()
export class TripAnalyticsService {
  private readonly logger = new Logger(TripAnalyticsService.name);

  constructor(private readonly prisma: PrismaService) { }

  // ============================================================================
  // UNOPTIMIZED VERSION - Single complex JOIN query (PROBLEMATIC)
  // ============================================================================
  async getDriverAnalyticsUnoptimized(
    driverId: number,
  ): Promise<DriverAnalyticsDto> {
    try {
      // PROBLEMATIC: Single complex JOIN query that can cause performance issues
      const prisma = this.prisma.getPrismaClient();
      const result = await prisma.$queryRaw`
        SELECT 
          d.id as driver_id,
          d.driver_name,
          d.phone_number,
          d.onboarding_date,
          COUNT(t.id) as total_trips,
          COALESCE(SUM(p.amount), 0) as total_earnings,
          COALESCE(AVG(r.rating_value), 0) as average_rating
        FROM drivers d
        LEFT JOIN trips t ON d.id = t.driver_id
        LEFT JOIN payments p ON t.id = p.trip_id
        LEFT JOIN ratings r ON t.id = r.trip_id
        WHERE d.id = ${driverId}
        GROUP BY d.id, d.driver_name, d.phone_number, d.onboarding_date
      `;

      if (!result || !Array.isArray(result) || result.length === 0) {
        throw new Error(`Driver with ID ${driverId} not found`);
      }

      const driverData = result[0] as any;

      // Get trip details for the unoptimized version
      const trips = await prisma.trip.findMany({
        where: { driver_id: driverId },
        select: {
          id: true,
          start_location: true,
          end_location: true,
          trip_date: true,
          payment: {
            select: { amount: true },
          },
          rating: {
            select: {
              rating_value: true,
              comment: true,
            },
          },
        },
        orderBy: { trip_date: 'desc' },
        take: 50,
      });

      // Transform trips to match DTO format
      const tripDetails = trips.map((trip) => ({
        trip_id: trip.id,
        start_location: trip.start_location,
        end_location: trip.end_location,
        trip_date: trip.trip_date,
        amount: Number(trip.payment?.amount || 0),
        rating_value: Number(trip.rating?.rating_value || 0),
        comment: trip.rating?.comment || '',
      }));

      // Calculate average rating more accurately for unoptimized version too
      const validRatings = tripDetails.filter((trip) => trip.rating_value > 0);
      const calculatedAverageRating =
        validRatings.length > 0
          ? validRatings.reduce((sum, trip) => sum + trip.rating_value, 0) /
          validRatings.length
          : 0;

      const analytics: DriverAnalyticsDto = {
        driver_id: driverData.driver_id,
        driver_name: driverData.driver_name,
        phone_number: driverData.phone_number,
        onboarding_date: driverData.onboarding_date,
        total_trips: Number(driverData.total_trips),
        total_earnings: Number(driverData.total_earnings),
        average_rating: Number(calculatedAverageRating.toFixed(2)), // Use calculated average
        trips: tripDetails, // Now populated with actual trip data
      };

      return analytics;
    } catch (error) {
      this.logger.error(
        `Error getting driver analytics (unoptimized): ${error.message}`,
      );
      throw error;
    }
  }

  // ============================================================================
  // TRULY OPTIMIZED VERSION - Fewer, more efficient queries (SCALABLE)
  // ============================================================================
  async getDriverAnalytics(driverId: number): Promise<DriverAnalyticsDto> {
    try {
      // TRULY OPTIMIZED: Fewer, more efficient queries for scalability
      const prisma = this.prisma.getPrismaClient();

      // Query 1: Get driver basic info (uses primary key - O(1) lookup)
      const driver = await prisma.driver.findUnique({
        where: { id: driverId },
        select: {
          id: true,
          driver_name: true,
          phone_number: true,
          onboarding_date: true,
        },
      });

      if (!driver) {
        throw new Error(`Driver with ID ${driverId} not found`);
      }

      // Query 2: Get trip count and earnings in one efficient query
      // Uses indexed driver_id and avoids complex JOINs
      const tripStats = await prisma.$queryRaw`
        SELECT 
          COUNT(t.id) as total_trips,
          COALESCE(SUM(p.amount), 0) as total_earnings
        FROM trips t
        LEFT JOIN payments p ON t.id = p.trip_id
        WHERE t.driver_id = ${driverId}
      `;

      // Query 3: Get trips with payments and ratings in one efficient query
      // Uses indexed driver_id and limits result set
      const tripsWithDetails = await prisma.$queryRaw`
        SELECT 
          t.id as trip_id,
          t.start_location,
          t.end_location,
          t.trip_date,
          COALESCE(p.amount, 0) as amount,
          COALESCE(r.rating_value, 0) as rating_value,
          COALESCE(r.comment, '') as comment
        FROM trips t
        LEFT JOIN payments p ON t.id = p.trip_id
        LEFT JOIN ratings r ON t.id = r.trip_id
        WHERE t.driver_id = ${driverId}
        ORDER BY t.trip_date DESC
        LIMIT 50
      `;

      // Calculate average rating from the trip details
      const validRatings = (tripsWithDetails as any[]).filter(
        (trip) => trip.rating_value > 0,
      );
      const averageRating =
        validRatings.length > 0
          ? validRatings.reduce((sum, trip) => sum + trip.rating_value, 0) /
          validRatings.length
          : 0;

      // Transform trips to match DTO format
      const tripDetails = (tripsWithDetails as any[]).map((trip) => ({
        trip_id: trip.trip_id,
        start_location: trip.start_location,
        end_location: trip.end_location,
        trip_date: trip.trip_date,
        amount: Number(trip.amount),
        rating_value: Number(trip.rating_value),
        comment: trip.comment,
      }));

      // Build analytics object
      const analytics: DriverAnalyticsDto = {
        driver_id: driver.id,
        driver_name: driver.driver_name,
        phone_number: driver.phone_number,
        onboarding_date: driver.onboarding_date,
        total_trips: Number(tripStats[0]?.total_trips || 0),
        total_earnings: Number(tripStats[0]?.total_earnings || 0),
        average_rating: Number(averageRating.toFixed(2)),
        trips: tripDetails,
      };

      return analytics;
    } catch (error) {
      this.logger.error(`Error getting driver analytics: ${error.message}`);
      throw error;
    }
  }

  // Location analytics with pagination
  async getLocationAnalytics(
    startDate: string,
    endDate: string,
    page: number = 1,
    limit: number = 50,
  ) {
    const offset = (page - 1) * limit;

    try {
      // Use Prisma aggregations with date grouping
      const prisma = this.prisma.getPrismaClient();
      const trips = await prisma.trip.findMany({
        where: {
          trip_date: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
        select: {
          start_location: true,
          end_location: true,
          payment: { select: { amount: true } },
        },
      });

      // Group and aggregate manually
      const locationMap = new Map<
        string,
        { count: number; total: number; sum: number }
      >();

      trips.forEach((trip) => {
        const key = `${trip.start_location}|${trip.end_location}`;
        const existing = locationMap.get(key) || { count: 0, total: 0, sum: 0 };
        existing.count++;
        existing.total += Number(trip.payment?.amount || 0);
        existing.sum += Number(trip.payment?.amount || 0);
        locationMap.set(key, existing);
      });

      // Filter and transform results
      const analytics = Array.from(locationMap.entries())
        .filter(([, data]) => data.count >= 5)
        .map(([key, data]) => {
          const [start, end] = key.split('|');
          return {
            start_location: start,
            end_location: end,
            trip_count: data.count,
            total_revenue: data.total,
            average_fare: data.count > 0 ? data.total / data.count : 0,
          };
        })
        .sort((a, b) => b.trip_count - a.trip_count)
        .slice(offset, offset + limit);

      return analytics;
    } catch (error) {
      this.logger.error(`Error getting location analytics: ${error.message}`);
      throw error;
    }
  }

  // Revenue analytics by month
  async getRevenueAnalytics(startDate: string, endDate: string) {
    try {
      // Use Prisma aggregations with date grouping
      const prisma = this.prisma.getPrismaClient();
      const trips = await prisma.trip.findMany({
        where: {
          trip_date: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
        select: {
          trip_date: true,
          driver_id: true,
          payment: {
            select: { amount: true },
          },
        },
      });

      // Group by month manually since Prisma doesn't support DATE_FORMAT
      const monthlyData = trips.reduce(
        (acc, trip) => {
          const month = trip.trip_date.toISOString().substring(0, 7); // YYYY-MM format
          if (!acc[month]) {
            acc[month] = {
              month,
              total_trips: 0,
              total_revenue: 0,
              active_drivers: new Set(),
            };
          }
          acc[month].total_trips++;
          acc[month].total_revenue += Number(trip.payment?.amount || 0);
          acc[month].active_drivers.add(trip.driver_id);
          return acc;
        },
        {} as Record<string, any>,
      );

      const analytics = Object.values(monthlyData).map((item: any) => ({
        month: item.month,
        total_trips: item.total_trips,
        total_revenue: item.total_revenue,
        active_drivers: item.active_drivers.size,
      }));

      // Sort by month descending
      analytics.sort((a, b) => b.month.localeCompare(a.month));

      return analytics;
    } catch (error) {
      this.logger.error(`Error getting revenue analytics: ${error.message}`);
      throw error;
    }
  }

  // Driver ranking (simplified)
  async getDriverRanking(limit: number = 50) {
    try {
      // Use Prisma aggregations for driver ranking
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const prisma = this.prisma.getPrismaClient();
      const drivers = await prisma.driver.findMany({
        select: {
          id: true,
          driver_name: true,
          trips: {
            where: {
              trip_date: { gte: sixMonthsAgo },
            },
            select: {
              id: true,
              payment: { select: { amount: true } },
              rating: { select: { rating_value: true } },
            },
          },
        },
      });

      // Calculate rankings
      const rankings = drivers
        .map((driver) => {
          const totalTrips = driver.trips.length;
          const totalEarnings = driver.trips.reduce(
            (sum, trip) => sum + Number(trip.payment?.amount || 0),
            0,
          );
          const averageRating =
            driver.trips.reduce(
              (sum, trip) => sum + Number(trip.rating?.rating_value || 0),
              0,
            ) / driver.trips.filter((trip) => trip.rating).length || 0;

          return {
            id: driver.id,
            driver_name: driver.driver_name,
            total_trips: totalTrips,
            total_earnings: totalEarnings,
            average_rating: averageRating,
          };
        })
        .filter((driver) => driver.total_trips >= 10)
        .sort((a, b) => b.total_earnings - a.total_earnings)
        .slice(0, limit);

      return rankings;
    } catch (error) {
      this.logger.error(`Error getting driver ranking: ${error.message}`);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    try {
      const dbHealthy = await this.prisma.getDriverById(1).catch(() => null);

      return {
        database: !!dbHealthy,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Health check failed: ${error.message}`);
      return {
        database: false,
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }
  }
}
