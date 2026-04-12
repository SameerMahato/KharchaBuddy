#!/bin/bash

# Install dependencies for all services

set -e

echo "Installing dependencies for all services..."

# Install shared library
echo "Installing shared library..."
cd shared
npm install
npm run build
cd ..

# Install services
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
  echo "Installing $service..."
  cd services/$service
  npm install
  cd ../..
done

# Install API Gateway
echo "Installing API Gateway..."
cd gateway
npm install
cd ..

# Install Frontend
echo "Installing Frontend..."
cd frontend
npm install
cd ..

echo "All dependencies installed successfully!"
