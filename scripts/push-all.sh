#!/bin/bash

# Push all Docker images to registry

set -e

echo "Pushing all Docker images..."

# Services
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
  "gateway"
  "frontend"
)

for service in "${SERVICES[@]}"; do
  echo "Pushing $service..."
  docker push kharchabuddy/$service:latest
done

echo "All images pushed successfully!"
