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

# Initialize Prisma (if not already initialized)
if [ ! -f "prisma/schema.prisma" ]; then
    echo "Initializing Prisma..."
    npx prisma init
    echo "✅ Prisma initialized"
else
    echo "✅ Prisma already initialized"
fi

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

# Start the development server
echo "Starting development server..."
npm run dev &
DEV_PID=$!
echo "✅ Development server started with PID: $DEV_PID"


echo "📝 Note: Development server is running in background. To stop it, use: kill $DEV_PID"


echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo -e "${BLUE}🚀 Next steps:${NC}"
echo "🔍 Database & Cache Management:"
echo "  • View data in Prisma Studio: npm run db:studio"
echo "  • Database migrations: npm run db:migrate"
echo ""
echo "📊 Performance Testing & Comparison:"
echo "  • Full performance analysis: npm run perf:full"
echo ""
echo "🐳 Docker Management:"
echo "  • View logs: npm run docker:logs"
echo "  • Stop services: npm run docker:down"
echo "  • Start services: npm run docker:up"
echo ""
echo "📁 Performance Reports:"
echo "  • Reports are saved in: ./reports/"
echo "  • Each test generates timestamped report files"
echo ""
echo "📚 Documentation:"
echo "  • Why optimization matters: OPTIMIZATION_APPROACH.md"
echo ""
echo "🎯 Ready for production development and testing!"
echo ""
echo "To stop services: docker-compose down" 