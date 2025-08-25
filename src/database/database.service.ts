import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config();

export interface DriverAnalytics {
  driver_id: number;
  driver_name: string;
  phone_number: string;
  onboarding_date: Date;
  total_trips: number;
  total_earnings: number;
  average_rating: number;
  trips: TripDetail[];
}

export interface TripDetail {
  trip_id: number;
  start_location: string;
  end_location: string;
  trip_date: Date;
  amount: number;
  rating_value: number;
  comment: string;
}

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private connection: mysql.Connection;

  async onModuleInit() {
    this.connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'trucklagbe',
      port: parseInt(process.env.DB_PORT) || 3306,
    });
  }

  async onModuleDestroy() {
    if (this.connection) {
      await this.connection.end();
    }
  }

  // UN-OPTIMIZED APPROACH: Single complex JOIN query
  async getDriverAnalyticsUnoptimized(
    driverId: number,
  ): Promise<DriverAnalytics> {
    const query = `
      SELECT 
        d.driver_id,
        d.driver_name,
        d.phone_number,
        d.onboarding_date,
        COUNT(t.trip_id) as total_trips,
        COALESCE(SUM(p.amount), 0) as total_earnings,
        COALESCE(AVG(r.rating_value), 0) as average_rating,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'trip_id', t.trip_id,
            'start_location', t.start_location,
            'end_location', t.end_location,
            'trip_date', t.trip_date,
            'amount', COALESCE(p.amount, 0),
            'rating_value', COALESCE(r.rating_value, 0),
            'comment', COALESCE(r.comment, '')
          )
        ) as trips
      FROM drivers d
      LEFT JOIN trips t ON d.driver_id = t.driver_id
      LEFT JOIN payments p ON t.trip_id = p.trip_id
      LEFT JOIN ratings r ON t.trip_id = r.trip_id
      WHERE d.driver_id = ?
      GROUP BY d.driver_id, d.driver_name, d.phone_number, d.onboarding_date
    `;

    const [rows] = await this.connection.execute(query, [driverId]);
    const row = rows[0] as any;

    if (!row) {
      throw new Error('Driver not found');
    }

    return {
      driver_id: row.driver_id,
      driver_name: row.driver_name,
      phone_number: row.phone_number,
      onboarding_date: row.onboarding_date,
      total_trips: row.total_trips,
      total_earnings: parseFloat(row.total_earnings),
      average_rating: parseFloat(row.average_rating),
      trips: JSON.parse(row.trips || '[]'),
    };
  }

  // OPTIMIZED APPROACH: Multiple smaller queries
  async getDriverAnalyticsOptimized(
    driverId: number,
  ): Promise<DriverAnalytics> {
    // Query 1: Get driver basic info
    const driverQuery = 'SELECT * FROM drivers WHERE driver_id = ?';
    const [driverRows] = await this.connection.execute(driverQuery, [driverId]);

    if (!Array.isArray(driverRows) || driverRows.length === 0) {
      throw new Error('Driver not found');
    }

    const driver = driverRows[0] as any;

    // Query 2: Get trips count and basic trip info
    const tripsQuery =
      'SELECT trip_id, start_location, end_location, trip_date FROM trips WHERE driver_id = ?';
    const [tripRows] = await this.connection.execute(tripsQuery, [driverId]);
    const trips = tripRows as any[];

    // Query 3: Get payments for all trips
    const tripIds = trips.map((t) => t.trip_id);
    let payments: any[] = [];
    if (tripIds.length > 0) {
      const paymentsQuery =
        'SELECT trip_id, amount FROM payments WHERE trip_id IN (?)';
      const [paymentRows] = await this.connection.execute(paymentsQuery, [
        tripIds,
      ]);
      payments = paymentRows as any[];
    }

    // Query 4: Get ratings for all trips
    let ratings: any[] = [];
    if (tripIds.length > 0) {
      const ratingsQuery =
        'SELECT trip_id, rating_value, comment FROM ratings WHERE trip_id IN (?)';
      const [ratingRows] = await this.connection.execute(ratingsQuery, [
        tripIds,
      ]);
      ratings = ratingRows as any[];
    }

    // Combine the data
    const tripDetails = trips.map((trip) => {
      const payment = payments.find((p) => p.trip_id === trip.trip_id);
      const rating = ratings.find((r) => r.trip_id === trip.trip_id);

      return {
        trip_id: trip.trip_id,
        start_location: trip.start_location,
        end_location: trip.end_location,
        trip_date: trip.trip_date,
        amount: payment ? parseFloat(payment.amount) : 0,
        rating_value: rating ? parseFloat(rating.rating_value) : 0,
        comment: rating ? rating.comment : '',
      };
    });

    const totalEarnings = tripDetails.reduce(
      (sum, trip) => sum + trip.amount,
      0,
    );
    const totalRatings = tripDetails.filter((trip) => trip.rating_value > 0);
    const averageRating =
      totalRatings.length > 0
        ? totalRatings.reduce((sum, trip) => sum + trip.rating_value, 0) /
          totalRatings.length
        : 0;

    return {
      driver_id: driver.driver_id,
      driver_name: driver.driver_name,
      phone_number: driver.phone_number,
      onboarding_date: driver.onboarding_date,
      total_trips: trips.length,
      total_earnings: totalEarnings,
      average_rating: averageRating,
      trips: tripDetails,
    };
  }

  // Create sample data for testing
  async createSampleData() {
    // Create tables if they don't exist
    await this.connection.execute(`
      CREATE TABLE IF NOT EXISTS drivers (
        driver_id INT PRIMARY KEY AUTO_INCREMENT,
        driver_name VARCHAR(100) NOT NULL,
        phone_number VARCHAR(20) NOT NULL,
        onboarding_date DATE NOT NULL
      )
    `);

    await this.connection.execute(`
      CREATE TABLE IF NOT EXISTS trips (
        trip_id INT PRIMARY KEY AUTO_INCREMENT,
        driver_id INT NOT NULL,
        start_location VARCHAR(200) NOT NULL,
        end_location VARCHAR(200) NOT NULL,
        trip_date DATE NOT NULL,
        FOREIGN KEY (driver_id) REFERENCES drivers(driver_id)
      )
    `);

    await this.connection.execute(`
      CREATE TABLE IF NOT EXISTS payments (
        payment_id INT PRIMARY KEY AUTO_INCREMENT,
        trip_id INT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        payment_date DATE NOT NULL,
        FOREIGN KEY (trip_id) REFERENCES trips(trip_id)
      )
    `);

    await this.connection.execute(`
      CREATE TABLE IF NOT EXISTS ratings (
        rating_id INT PRIMARY KEY AUTO_INCREMENT,
        trip_id INT NOT NULL,
        rating_value DECIMAL(3,2) NOT NULL,
        comment TEXT,
        FOREIGN KEY (trip_id) REFERENCES trips(trip_id)
      )
    `);

    // Insert sample data
    await this.connection.execute(`
      INSERT IGNORE INTO drivers (driver_id, driver_name, phone_number, onboarding_date) VALUES
      (1, 'John Doe', '+1234567890', '2023-01-15'),
      (2, 'Jane Smith', '+1234567891', '2023-02-20')
    `);

    await this.connection.execute(`
      INSERT IGNORE INTO trips (trip_id, driver_id, start_location, end_location, trip_date) VALUES
      (1, 1, 'New York', 'Boston', '2024-01-15'),
      (2, 1, 'Boston', 'Philadelphia', '2024-01-20'),
      (3, 1, 'Philadelphia', 'Washington DC', '2024-01-25'),
      (4, 2, 'Los Angeles', 'San Francisco', '2024-01-18'),
      (5, 2, 'San Francisco', 'Seattle', '2024-01-22')
    `);

    await this.connection.execute(`
      INSERT IGNORE INTO payments (payment_id, trip_id, amount, payment_date) VALUES
      (1, 1, 150.00, '2024-01-16'),
      (2, 2, 200.00, '2024-01-21'),
      (3, 3, 180.00, '2024-01-26'),
      (4, 4, 120.00, '2024-01-19'),
      (5, 5, 250.00, '2024-01-23')
    `);

    await this.connection.execute(`
      INSERT IGNORE INTO ratings (rating_id, trip_id, rating_value, comment) VALUES
      (1, 1, 4.5, 'Great service!'),
      (2, 2, 5.0, 'Excellent driver'),
      (3, 3, 4.0, 'Good trip'),
      (4, 4, 4.8, 'Very professional'),
      (5, 5, 4.2, 'Safe driving')
    `);
  }
}
