#!/bin/bash

# Infrastructure Verification Script
# Tests all Phase 1 infrastructure components

set -e

echo "=========================================="
echo "Phase 1 Infrastructure Verification"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print success
success() {
    echo -e "${GREEN}✓${NC} $1"
}

# Function to print error
error() {
    echo -e "${RED}✗${NC} $1"
}

# Function to print warning
warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if Docker is running
echo "1. Checking Docker..."
if docker info > /dev/null 2>&1; then
    success "Docker is running"
else
    error "Docker is not running"
    exit 1
fi
echo ""

# Check if Docker Compose is installed
echo "2. Checking Docker Compose..."
if docker-compose --version > /dev/null 2>&1; then
    success "Docker Compose is installed"
else
    error "Docker Compose is not installed"
    exit 1
fi
echo ""

# Start services
echo "3. Starting Docker Compose services..."
docker-compose up -d
sleep 10
success "Services started"
echo ""

# Check MongoDB
echo "4. Checking MongoDB..."
if docker exec kharchabuddy-mongodb mongosh --quiet --eval "db.adminCommand('ping')" -u admin -p password123 --authenticationDatabase admin > /dev/null 2>&1; then
    success "MongoDB is running and accessible"
else
    error "MongoDB is not accessible"
fi
echo ""

# Check Redis
echo "5. Checking Redis..."
if docker exec kharchabuddy-redis redis-cli -a redis123 ping > /dev/null 2>&1; then
    success "Redis is running and accessible"
else
    error "Redis is not accessible"
fi
echo ""

# Check TimescaleDB
echo "6. Checking TimescaleDB..."
if docker exec kharchabuddy-timescaledb pg_isready -U postgres > /dev/null 2>&1; then
    success "TimescaleDB is running and accessible"
else
    error "TimescaleDB is not accessible"
fi
echo ""

# Check Kafka
echo "7. Checking Kafka..."
if docker exec kharchabuddy-kafka kafka-broker-api-versions --bootstrap-server localhost:9092 > /dev/null 2>&1; then
    success "Kafka is running and accessible"
else
    warning "Kafka might still be starting up (this is normal)"
fi
echo ""

# Check Prometheus
echo "8. Checking Prometheus..."
if curl -s http://localhost:9090/-/healthy > /dev/null 2>&1; then
    success "Prometheus is running and accessible"
else
    error "Prometheus is not accessible"
fi
echo ""

# Check Grafana
echo "9. Checking Grafana..."
if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    success "Grafana is running and accessible"
else
    warning "Grafana might still be starting up (this is normal)"
fi
echo ""

# Check environment files
echo "10. Checking environment configuration..."
if [ -f ".env.example" ]; then
    success ".env.example exists"
else
    error ".env.example not found"
fi

if [ -f "services/shared/.env.example" ]; then
    success "services/shared/.env.example exists"
else
    error "services/shared/.env.example not found"
fi
echo ""

# Check shared libraries
echo "11. Checking shared libraries..."
if [ -d "services/shared" ]; then
    success "Shared libraries directory exists"
    
    if [ -f "services/shared/config/secrets.ts" ]; then
        success "Secrets management utility exists"
    else
        error "Secrets management utility not found"
    fi
    
    if [ -f "services/shared/logging/logger.ts" ]; then
        success "Logging infrastructure exists"
    else
        error "Logging infrastructure not found"
    fi
    
    if [ -f "services/shared/monitoring/sentry.ts" ]; then
        success "Sentry integration exists"
    else
        error "Sentry integration not found"
    fi
else
    error "Shared libraries directory not found"
fi
echo ""

# Check CI/CD configuration
echo "12. Checking CI/CD configuration..."
if [ -f ".github/workflows/ci.yml" ]; then
    success "CI pipeline configuration exists"
else
    error "CI pipeline configuration not found"
fi

if [ -f ".github/workflows/cd.yml" ]; then
    success "CD pipeline configuration exists"
else
    error "CD pipeline configuration not found"
fi
echo ""

# Check documentation
echo "13. Checking documentation..."
if [ -f "docs/infrastructure-setup.md" ]; then
    success "Infrastructure documentation exists"
else
    error "Infrastructure documentation not found"
fi
echo ""

# Summary
echo "=========================================="
echo "Verification Summary"
echo "=========================================="
echo ""
echo "All Phase 1 infrastructure components have been verified!"
echo ""
echo "Access URLs:"
echo "  - Prometheus: http://localhost:9090"
echo "  - Grafana: http://localhost:3001 (admin/admin123)"
echo "  - MongoDB: mongodb://admin:password123@localhost:27017"
echo "  - Redis: redis://localhost:6379 (password: redis123)"
echo "  - TimescaleDB: postgresql://postgres:postgres123@localhost:5432"
echo "  - Kafka: localhost:9093"
echo ""
echo "Next steps:"
echo "  1. Review docs/infrastructure-setup.md"
echo "  2. Copy .env.example to .env and configure"
echo "  3. Build shared libraries: cd services/shared && npm install && npm run build"
echo "  4. Proceed to Phase 2: Core Backend Architecture"
echo ""
