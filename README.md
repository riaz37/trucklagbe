# 🚛 TruckLagBE - Trip Analytics Performance Solution

A high-performance Trip Analytics system built with **NestJS** and **Prisma**, demonstrating database optimization and performance engineering best practices.

## 🚀 Quick Start

### **One-Command Setup**
```bash
npm run setup
```

This automatically sets up everything:
- ✅ Prerequisites check (Docker, Node.js, npm)
- 🐳 Docker services (MySQL)
- 📦 Dependencies installation
- 🗄️ Database schema and seeding
- 🏗️ Application build

### **Manual Setup**
```bash
# Install dependencies
npm install

# Environment setup
cp env.example .env

# Database setup
npm run db:generate
npm run db:push
npm run db:seed

# Start development server
npm run dev
```

## 🛠️ Tech Stack

- **Framework**: NestJS with TypeScript
- **Database**: MySQL with Prisma ORM
- **Performance**: Database optimization & query tuning
- **Monitoring**: Real-time performance tracking
- **Containerization**: Docker Compose

## 📁 Project Structure

```
src/
├── trip-analytics/          # Trip analytics module
├── database/                # Database services
├── common/                  # Shared services & interceptors
└── types/                   # TypeScript definitions

prisma/
├── schema.prisma           # Database schema
└── seed.ts                # Sample data seeder

scripts/
├── quick-start.sh         # Automated setup script
├── performance-comparison.sh # Performance benchmarking
└── generate-massive-data.js # Test data generation
```

## 🎯 Core Features

- **Driver Analytics**: Performance metrics and rankings
- **Location Analytics**: Trip analysis by locations
- **Revenue Analytics**: Monthly revenue tracking
- **Performance Monitoring**: Real-time metrics and alerts
- **Database Optimization**: Optimized vs. unoptimized queries

## 🧪 Testing & Performance

### **Quick Testing**
```bash
# Test endpoints
curl "http://localhost:3000/api/v1/drivers/1/analytics"
curl "http://localhost:3000/api/v1/drivers/1/analytics/unoptimized"
```

### **Performance Testing**
```bash
# Generate test data
npm run data:generate

# Run performance tests
npm run perf:full
```

### **Database Management**
```bash
# Prisma Studio
npm run db:studio
```

## 📊 API Endpoints

- `GET /api/v1/drivers/:driverId/analytics` - Optimized driver analytics
- `GET /api/v1/drivers/:driverId/analytics/unoptimized` - Unoptimized comparison
- `GET /api/v1/drivers/locations` - Location-based analytics
- `GET /api/v1/drivers/revenue` - Revenue analytics
- `GET /api/v1/drivers/ranking` - Driver performance rankings
- `GET /api/v1/drivers/health` - Service health check
- `GET /api/v1/drivers/performance` - Performance metrics

## 🐳 Docker Commands

```bash
# View logs
npm run docker:logs

# Stop services
npm run docker:down

# Start services
npm run docker:up
```

## 📚 Documentation

- **[OPTIMIZATION_APPROACH.md](OPTIMIZATION_APPROACH.md)** - Performance analysis
- **[NestJS Docs](https://nestjs.com/)** - Framework documentation
- **[Prisma Docs](https://www.prisma.io/docs/)** - Database ORM guide

## 🌏 Sample Data

The system comes with realistic Bangladesh-based logistics data:
- **20 drivers** with authentic names
- **100 trips** between major cities
- **Payment records** in BDT currency
- **Rating system** with comments

## 🚀 Running the App

```bash
# Development
npm run dev

# Production
npm run build
npm run start:prod
```

## 🔧 Development

```bash
# Linting
npm run lint

# Formatting
npm run format

# Testing
npm run test
```

