<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

# TruckLagBE - Trip Analytics Performance Solution

This project demonstrates the solution to a common database performance problem: replacing complex JOIN queries with multiple optimized queries for better scalability.

## 🚀 Problem Statement

The Trip Analytics feature was experiencing significant performance degradation in production due to a complex SQL query with multiple JOIN clauses. While working perfectly on small development datasets, it caused database connection timeouts and poor performance under high load.

## 🏗️ Solution Architecture

### Un-optimized Approach (Anti-pattern)
- **Single complex JOIN query** with 4 table joins
- **O(N³) complexity** - performance degrades exponentially with data growth
- **Memory intensive** - large result sets consume excessive RAM
- **Connection blocking** - long-running queries block other operations

### Optimized Approach (Best Practice)
- **Multiple simple queries** with proper indexing
- **O(N) complexity** - performance scales linearly with data growth
- **Memory efficient** - smaller result sets per query
- **Better concurrency** - shorter connection hold times

## 📁 Project Structure

```
src/
├── database/
│   ├── database.module.ts      # Database module configuration
│   └── database.service.ts     # Database operations (both approaches)
├── trip-analytics/
│   ├── trip-analytics.module.ts    # Feature module
│   ├── trip-analytics.controller.ts # API endpoints
│   └── trip-analytics.service.ts   # Business logic
└── app.module.ts               # Main application module

test-performance.js              # Performance testing script
TRIP_ANALYTICS_ANALYSIS.md      # Detailed analysis document
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
cp .env.example .env

# Configure database connection
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=trucklagbe
DB_PORT=3306
```

### 3. Database Tables
The application will automatically create the required tables and sample data on startup.

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

## 🧪 Performance Testing

### Using the Test Script
```bash
# Install mysql2 globally if needed
npm install -g mysql2

# Run performance test
node test-performance.js
```

### Using the API
```bash
# Test un-optimized endpoint
curl "http://localhost:3000/api/v1/drivers/1/analytics/unoptimized"

# Test optimized endpoint
curl "http://localhost:3000/api/v1/drivers/1/analytics/optimized"

# Test with query parameter
curl "http://localhost:3000/api/v1/drivers/1/analytics?optimized=true"
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
3. **Indexing is crucial** for both approaches
4. **Connection pooling** benefits from shorter query times
5. **Memory usage** scales differently between approaches

## 🏆 Best Practices Implemented

- ✅ **Separation of concerns** - Database, service, and controller layers
- ✅ **Error handling** - Proper HTTP status codes and error messages
- ✅ **Input validation** - Parameter validation and sanitization
- ✅ **Performance monitoring** - Built-in performance testing capabilities
- ✅ **Scalable architecture** - Linear performance scaling
- ✅ **Database indexing** - Proper table structure and relationships

## 📚 Additional Resources

- [TRIP_ANALYTICS_ANALYSIS.md](TRIP_ANALYTICS_ANALYSIS.md) - Detailed technical analysis
- [NestJS Documentation](https://nestjs.com/) - Framework documentation
- [MySQL Performance Tuning](https://dev.mysql.com/doc/refman/8.0/en/optimization.html) - Database optimization guide

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the UNLICENSED license.
