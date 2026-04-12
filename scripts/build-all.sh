#!/bin/bash

# Build all Docker images for KharchaBuddy

set -e

echo "Building all Docker images..."

# Build shared library first
echo "Building shared library..."
cd shared
npm install
npm run build
cd ..

# Build services
SERVICES=(
  "auth-service"
  "expense-service"
  "budget-service"
  "ai-cfo-service"
  "prediction-engine"
  "social-finance"
  "wealth-builder"
  "tax-optimizer"
  "integration"
)

for service in "${SERVICES[@]}"; do
  echo "Building $service..."
  cd services/$service
  docker build -t kharchabuddy/$service:latest .
  cd ../..
done

# Build API Gateway
echo "Building API Gateway..."
cd gateway
docker build -t kharchabuddy/gateway:latest .
cd ..

# Build Frontend
echo "Building Frontend..."
cd frontend
docker build -t kharchabuddy/frontend:latest .
cd ..

echo "All images built successfully!"
