# Deployment Guide - AI Financial Operating System

## Overview

This guide covers deploying the AI Financial Operating System to production using Kubernetes.

## Prerequisites

- Kubernetes cluster (v1.24+)
- kubectl configured
- Docker Hub account (or private registry)
- Domain name with DNS configured
- SSL/TLS certificates

## Quick Start

### 1. Build and Push Docker Images

```bash
# Build all services
./scripts/build-all.sh

# Push to registry
./scripts/push-all.sh
```

### 2. Create Namespace

```bash
kubectl apply -f k8s/namespace.yaml
```

### 3. Configure Secrets

```bash
# Edit secrets with your values
kubectl apply -f k8s/secrets.yaml
```

### 4. Deploy Infrastructure

```bash
# MongoDB
kubectl apply -f k8s/mongodb-statefulset.yaml

# Redis
kubectl apply -f k8s/redis-deployment.yaml

# Kafka (if using)
kubectl apply -f k8s/kafka-deployment.yaml
```

### 5. Deploy Services

```bash
# Deploy all microservices
kubectl apply -f k8s/expense-service-deployment.yaml
# ... repeat for all services

# Deploy API Gateway
kubectl apply -f k8s/gateway-deployment.yaml

# Deploy Frontend
kubectl apply -f k8s/frontend-deployment.yaml
```

### 6. Verify Deployment

```bash
# Check all pods
kubectl get pods -n kharchabuddy

# Check services
kubectl get svc -n kharchabuddy

# Check logs
kubectl logs -f deployment/api-gateway -n kharchabuddy
```

## Production Checklist

- [ ] Update all secrets in k8s/secrets.yaml
- [ ] Configure SSL/TLS certificates
- [ ] Set up monitoring (Prometheus/Grafana)
- [ ] Configure log aggregation
- [ ] Set up backup strategy
- [ ] Configure auto-scaling
- [ ] Set resource limits
- [ ] Enable network policies
- [ ] Configure ingress
- [ ] Set up CI/CD pipeline

## Monitoring

Access monitoring dashboards:
- Grafana: http://your-domain/grafana
- Prometheus: http://your-domain/prometheus

## Troubleshooting

### Pods not starting
```bash
kubectl describe pod <pod-name> -n kharchabuddy
kubectl logs <pod-name> -n kharchabuddy
```

### Service connectivity issues
```bash
kubectl get svc -n kharchabuddy
kubectl describe svc <service-name> -n kharchabuddy
```

## Scaling

```bash
# Scale specific service
kubectl scale deployment expense-service --replicas=5 -n kharchabuddy

# Auto-scaling is configured via HPA
kubectl get hpa -n kharchabuddy
```

## Backup & Recovery

### MongoDB Backup
```bash
kubectl exec -it mongodb-0 -n kharchabuddy -- mongodump --out /backup
```

### Redis Backup
```bash
kubectl exec -it redis-0 -n kharchabuddy -- redis-cli BGSAVE
```

## Updates & Rollbacks

```bash
# Update image
kubectl set image deployment/expense-service expense-service=kharchabuddy/expense-service:v2 -n kharchabuddy

# Rollback
kubectl rollout undo deployment/expense-service -n kharchabuddy

# Check rollout status
kubectl rollout status deployment/expense-service -n kharchabuddy
```

## Support

For issues, check:
1. Pod logs
2. Service endpoints
3. Network policies
4. Resource limits
5. Secrets configuration
