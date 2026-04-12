#!/bin/bash

# Deploy all services to Kubernetes

set -e

echo "Deploying to Kubernetes..."

# Create namespace
kubectl apply -f k8s/namespace.yaml

# Apply secrets
kubectl apply -f k8s/secrets.yaml

# Deploy infrastructure
echo "Deploying infrastructure..."
kubectl apply -f k8s/mongodb-statefulset.yaml
kubectl apply -f k8s/redis-deployment.yaml

# Wait for infrastructure
echo "Waiting for infrastructure to be ready..."
kubectl wait --for=condition=ready pod -l app=mongodb -n kharchabuddy --timeout=300s
kubectl wait --for=condition=ready pod -l app=redis -n kharchabuddy --timeout=300s

# Deploy services
echo "Deploying services..."
kubectl apply -f k8s/auth-service-deployment.yaml
kubectl apply -f k8s/expense-service-deployment.yaml
kubectl apply -f k8s/budget-service-deployment.yaml
kubectl apply -f k8s/ai-cfo-service-deployment.yaml
kubectl apply -f k8s/prediction-engine-deployment.yaml
kubectl apply -f k8s/all-services-deployment.yaml

# Deploy gateway
echo "Deploying API Gateway..."
kubectl apply -f k8s/gateway-deployment.yaml

echo "Waiting for services to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment --all -n kharchabuddy

echo "Deployment complete!"
echo "Service status:"
kubectl get pods -n kharchabuddy
echo ""
echo "Service endpoints:"
kubectl get services -n kharchabuddy
