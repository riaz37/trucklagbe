import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  constructor() {}

  private prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Connection pool optimization
    log: ['error', 'warn'],
    // Query timeout optimization
    errorFormat: 'pretty',
  });

  async onModuleInit() {
    await this.prisma.$connect();
    console.log('🚀 Prisma connected with optimized settings');
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }

  // PURE DATA ACCESS METHODS - No business logic

  // Get driver by ID
  async getDriverById(driverId: number) {
    return await this.prisma.driver.findUnique({
      where: { id: driverId },
      select: {
        id: true,
        driver_name: true,
        phone_number: true,
        onboarding_date: true,
      },
    });
  }

  // Get trips by driver ID
  async getTripsByDriverId(driverId: number) {
    return await this.prisma.trip.findMany({
      where: { driver_id: driverId },
      select: {
        id: true,
        start_location: true,
        end_location: true,
        trip_date: true,
      },
    });
  }

  // Get payments by trip IDs
  async getPaymentsByTripIds(tripIds: number[]) {
    if (tripIds.length === 0) return [];

    return await this.prisma.payment.findMany({
      where: { trip_id: { in: tripIds } },
      select: { trip_id: true, amount: true },
    });
  }

  // Get ratings by trip IDs
  async getRatingsByTripIds(tripIds: number[]) {
    if (tripIds.length === 0) return [];

    return await this.prisma.rating.findMany({
      where: { trip_id: { in: tripIds } },
      select: { trip_id: true, rating_value: true, comment: true },
    });
  }

  // Get driver with all relations (for unoptimized approach)
  async getDriverWithRelations(driverId: number) {
    return await this.prisma.driver.findUnique({
      where: { id: driverId },
      include: {
        trips: {
          include: {
            payment: true,
            rating: true,
          },
        },
      },
    });
  }

  // Get Prisma client for direct access if needed
  getPrismaClient() {
    return this.prisma;
  }
}
