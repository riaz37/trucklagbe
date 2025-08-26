#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 TRUCKLAGBE QUICK START${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}🔍 Checking prerequisites...${NC}"
command -v docker >/dev/null 2>&1 || { echo -e "${RED}❌ Docker is required but not installed. Aborting.${NC}" >&2; exit 1; }
command -v node >/dev/null 2>&1 || { echo -e "${RED}❌ Node.js is required but not installed. Aborting.${NC}" >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo -e "${RED}❌ npm is required but not installed. Aborting.${NC}" >&2; exit 1; }
echo -e "${GREEN}✅ All prerequisites met${NC}"
echo ""

# Check if .env exists, if not create it
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cp env.example .env
    sed -i 's|mysql://username:password@localhost:3306/trucklagbe|mysql://trucklagbe_user:trucklagbe_password@localhost:3306/trucklagbe|g' .env
fi

# Start Docker services
echo "Starting Docker services..."
docker-compose up -d

# Wait for MySQL to be ready with proper health check
echo "Waiting for MySQL to be ready..."
echo "This may take a few minutes..."

# Function to check MySQL connectivity
check_mysql() {
    docker exec trucklagbe-mysql mysqladmin ping -h localhost -u trucklagbe_user -ptrucklagbe_password >/dev/null 2>&1
}

# Function to check if database and tables exist
check_database_ready() {
    docker exec trucklagbe-mysql mysql -u trucklagbe_user -ptrucklagbe_password -e "USE trucklagbe; SHOW TABLES;" >/dev/null 2>&1
}

# Wait for MySQL to be fully ready
max_attempts=60
attempt=1
while [ $attempt -le $max_attempts ]; do
    if check_mysql; then
        echo "✅ MySQL is ready!"
        break
    else
        echo "⏳ Waiting for MySQL... (attempt $attempt/$max_attempts)"
        sleep 5
        attempt=$((attempt + 1))
    fi
done

if [ $attempt -gt $max_attempts ]; then
    echo -e "${RED}❌ MySQL failed to start within expected time. Check Docker logs:${NC}"
    echo "docker-compose logs mysql"
    exit 1
fi

# Restart MySQL to ensure clean state
echo "Restarting MySQL..."
docker-compose restart mysql

# Wait for MySQL to be ready again after restart
echo "Waiting for MySQL to be ready after restart..."
sleep 10

# Double-check MySQL connectivity before proceeding
echo "Verifying database connectivity..."
if ! check_mysql; then
    echo -e "${RED}❌ Database connectivity failed after restart. Aborting.${NC}"
    exit 1
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Generate Prisma client
echo "Setting up database..."
npm run db:generate

# Verify database connection before pushing schema
echo "Verifying database connection before schema push..."
if ! check_mysql; then
    echo -e "${RED}❌ Database connection lost. Aborting.${NC}"
    exit 1
fi

npm run db:push

# Final connectivity check before seeding
echo "Final database connectivity check before seeding..."
if ! check_mysql; then
    echo -e "${RED}❌ Database connection lost before seeding. Aborting.${NC}"
    exit 1
fi

# Check if database and tables are ready
echo "Verifying database schema is ready..."
if ! check_database_ready; then
    echo -e "${RED}❌ Database schema not ready. Tables may not exist. Aborting.${NC}"
    exit 1
fi

# Seed database with sample data
echo "Seeding database with sample data..."
if ! npm run db:seed; then
    echo -e "${RED}❌ Database seeding failed. Check the logs above for errors.${NC}"
    echo "You can try running the seed manually: npm run db:seed"
    exit 1
fi
echo "✅ Database seeding completed successfully!"

# Build the app
echo "Building application..."
npm run build

# Note: HTTP performance testing available after starting the app
echo ""
echo -e "${BLUE}🧪 HTTP Performance Testing Available${NC}"
echo "After starting the application, you can test endpoint performance:"
echo "  • Quick test: npm run test:http"
echo "  • Full comparison: npm run test:performance:full"

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo -e "${BLUE}🚀 Next steps:${NC}"
echo "1. Start development server: npm run dev"
echo "2. Open Prisma Studio: npm run db:studio"
echo "3. Access API at: http://localhost:3000"
echo ""
echo "📊 Production Data & Performance Testing:"
echo ""
echo "🌊 Generate Massive Production Data:"
echo "  • Full production dataset (10K drivers, 1M trips): npm run data:generate:massive"
echo ""
echo "⚡ Performance & Load Testing:"
echo "  • Quick HTTP endpoint test: npm run test:http"
echo "  • Full performance comparison: npm run test:performance:full"
echo "  • Database performance test: npm run test:performance"
echo "  • Load testing with Artillery: npm run test:load"
echo "  • Performance comparison test: npm run test:comparison"
echo "  • All tests: npm run test:all"
echo ""
echo "🔍 Database & Cache Management:"
echo "  • View data in Prisma Studio: npm run db:studio"
echo "  • Test Redis cache: npm run redis:cache"
echo "  • Database migrations: npm run db:migrate"
echo ""
echo "🐳 Docker Management:"
echo "  • View logs: npm run docker:logs"
echo "  • Stop services: npm run docker:down"
echo "  • Start services: npm run docker:up"
echo ""
echo "🎯 Ready for production development and testing!"
echo ""
echo "To stop services: docker-compose down" 