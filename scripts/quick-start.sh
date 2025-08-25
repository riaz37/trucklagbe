#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 TRUCKLAGBE QUICK START${NC}"
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

# Wait for MySQL to be ready
echo "Waiting for MySQL to be ready..."
sleep 15

# Copy MySQL config and restart
echo "Configuring MySQL..."
docker cp mysql/conf/my.cnf trucklagbe-mysql:/etc/mysql/conf.d/
docker-compose restart mysql
sleep 10

# Install dependencies
echo "Installing dependencies..."
npm install

# Generate Prisma client
echo "Setting up database..."
npm run db:generate
npm run db:push

# Build the app
echo "Building application..."
npm run build

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Start development server: npm run start:dev"
echo "2. Open Prisma Studio: npm run db:studio"
echo "3. Access API at: http://localhost:3000"
echo ""
echo "To stop services: docker-compose down" 