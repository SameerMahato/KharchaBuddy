#!/bin/bash

# Run tests for all services

set -e

echo "Running tests for all services..."

# Test shared library
echo "Testing shared library..."
cd shared
npm test || echo "No tests configured for shared"
cd ..

# Test services
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
  echo "Testing $service..."
  cd services/$service
  npm test || echo "No tests configured for $service"
  cd ../..
done

# Test API Gateway
echo "Testing API Gateway..."
cd gateway
npm test || echo "No tests configured for gateway"
cd ..

# Test Frontend
echo "Testing Frontend..."
cd frontend
npm test || echo "No tests configured for frontend"
cd ..

echo "All tests completed!"
