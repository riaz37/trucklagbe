# TruckLagBE - Trip Analytics Performance Solution

A high-performance Trip Analytics system built with **NestJS** and **Prisma**, demonstrating the solution to complex database JOIN performance problems using **Bangladesh-based logistics data**.

## 🚀 Problem Statement

The Trip Analytics feature was experiencing significant performance degradation in production due to complex SQL queries with multiple JOIN clauses. While working perfectly on small development datasets, it caused:

- Database connection timeouts
- Poor response times under high load
- Resource exhaustion
- Application unresponsiveness

## 🏗️ Solution Architecture

### **Un-optimized Approach (Anti-pattern)**
- **Single complex JOIN query** with 4 table joins
- **O(N³) complexity** - performance degrades exponentially with data growth
- **Memory intensive** - large result sets consume excessive RAM
- **Connection blocking** - long-running queries block other operations

### **Optimized Approach (Best Practice)**
- **Multiple simple queries** with proper indexing
- **O(N) complexity** - performance scales linearly with data growth
- **Memory efficient** - smaller result sets per query
- **Better concurrency** - shorter connection hold times

## 🛠️ Tech Stack

- **Framework**: NestJS (Node.js)
- **Database**: MySQL with Prisma ORM
- **Language**: TypeScript
- **Data**: Bangladesh-based logistics (cities, names, routes)

## 📁 Project Structure

```
src/
├── types/
│   └── trip-analytics.types.ts    # Centralized type definitions
├── database/
│   └── prisma.service.ts          # Prisma database operations
├── trip-analytics/
│   ├── trip-analytics.module.ts   # Feature module
│   ├── trip-analytics.controller.ts # API endpoints
│   └── trip-analytics.service.ts  # Business logic
└── app.module.ts                  # Main application module

prisma/
├── schema.prisma                  # Database schema
└── seed.ts                       # Bangladesh data seeder
```

## 🛠️ Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Database Setup
Create a MySQL database and set environment variables:

```bash
# Create .env file
cp env.example .env

# Configure database connection (Prisma format)
DATABASE_URL="mysql://username:password@localhost:3306/trucklagbe"
```

### 3. Database Setup & Seeding
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (creates tables)
npm run db:push

# Seed with Bangladesh-based sample data
npm run db:seed
```

**What the seed script creates:**
- 🌏 **20 Bangladeshi drivers** with realistic names
- 🚛 **100 trips** between Bangladesh cities (Dhaka, Chittagong, Sylhet, etc.)
- 💰 **Payment records** with amounts in BDT (500-5000 range)
- ⭐ **Rating records** with realistic comments in English

## 🚀 Running the Application

### Development Mode
```bash
npm run start:dev
```

### Production Mode
```bash
npm run build
npm run start:prod
```

## 📊 API Endpoints

### Get Driver Analytics (Default: Un-optimized)
```
GET /api/v1/drivers/:driverId/analytics
```

### Get Driver Analytics (Un-optimized)
```
GET /api/v1/drivers/:driverId/analytics/unoptimized
```

### Get Driver Analytics (Optimized)
```
GET /api/v1/drivers/:driverId/analytics/optimized
```

### Query Parameters
- `optimized=true` - Use the optimized approach
- `optimized=false` - Use the un-optimized approach (default)

## 🧪 Testing the System

### Using the API
```bash
# Test un-optimized endpoint
curl "http://localhost:3000/api/v1/drivers/1/analytics/unoptimized"

# Test optimized endpoint
curl "http://localhost:3000/api/v1/drivers/1/analytics/optimized"

# Test with query parameter
curl "http://localhost:3000/api/v1/drivers/1/analytics?optimized=true"
```

### Database Commands
```bash
# View data in Prisma Studio
npm run db:studio

# Reset and reseed database
npm run db:push
npm run db:seed
```

## 📈 Expected Performance Results

### Small Dataset (100 trips)
- **Un-optimized**: ~50ms
- **Optimized**: ~80ms (multiple round-trips)

### Large Dataset (10,000 trips)
- **Un-optimized**: ~5000ms (exponential scaling)
- **Optimized**: ~200ms (linear scaling)

### Concurrent Users (100)
- **Un-optimized**: Many timeouts, high error rate
- **Optimized**: Consistent performance, low error rate

## 🔍 Key Performance Insights

1. **Complex JOINs scale exponentially** - O(N³) complexity
2. **Multiple simple queries scale linearly** - O(N) complexity
3. **Prisma provides type safety** and query optimization
4. **Connection pooling** benefits from shorter query times
5. **Memory usage** scales differently between approaches

## 🏆 Best Practices Implemented

- ✅ **Type Safety** - Centralized TypeScript interfaces
- ✅ **Separation of Concerns** - Clean architecture layers
- ✅ **Error Handling** - Proper HTTP status codes and validation
- ✅ **Database Optimization** - Prisma with efficient queries
- ✅ **Scalable Architecture** - Linear performance scaling
- ✅ **Realistic Data** - Bangladesh-based logistics scenarios

## 🌏 Bangladesh Data Features

- **Cities**: 20 major Bangladeshi cities (Dhaka, Chittagong, Sylhet, etc.)
- **Names**: Authentic Bangladeshi driver names
- **Routes**: Realistic inter-city logistics routes
- **Currency**: BDT (Bangladeshi Taka) amounts
- **Culture**: Contextually appropriate ratings and comments

## 📚 Additional Resources

- [TRIP_ANALYTICS_ANALYSIS.md](TRIP_ANALYTICS_ANALYSIS.md) - Detailed technical analysis
- [SOLUTION_SUMMARY.md](SOLUTION_SUMMARY.md) - Executive summary and implementation details
- [NestJS Documentation](https://nestjs.com/) - Framework documentation
- [Prisma Documentation](https://www.prisma.io/docs/) - Database ORM guide

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the UNLICENSED license.