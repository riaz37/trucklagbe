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
- **Containerization**: Docker Compose
- **Testing**: Artillery load testing

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

tests/
├── load/                   # Load testing scripts
└── performance/            # Performance testing
```

## 🧪 Testing & Performance

### **Quick Testing**
```bash
# Test endpoints
curl "http://localhost:3000/api/v1/drivers/1/analytics/unoptimized"
curl "http://localhost:3000/api/v1/drivers/1/analytics/optimized"
```

### **Performance Testing**
```bash
# Generate test data
npm run data:generate:massive

# Run performance tests
npm run test:http
npm run test:performance:full
npm run test:load
```

### **Database Management**
```bash
# Prisma Studio
npm run db:studio


```

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

- **[PERFORMANCE_ENGINEERING.md](PERFORMANCE_ENGINEERING.md)** - Detailed performance analysis
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


