# Infrastructure & DevOps Setup Documentation

## Overview

This document describes the infrastructure and DevOps setup for the AI Financial Operating System.

## Phase 1: Infrastructure Components

### 1.1 Docker Compose Setup ✅

**Status**: Complete

The Docker Compose configuration includes:
- MongoDB (Primary Database)
- Redis (Caching Layer)
- TimescaleDB (Time-series Data)
- Kafka + Zookeeper (Event Bus)
- Prometheus (Metrics Collection)
- Grafana (Monitoring Dashboards)

**File**: `docker-compose.yml`

**Usage**:
```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f [service-name]
```

### 1.2 Database Configuration ✅

**Status**: Complete

**MongoDB**:
- Port: 27017
- Initialization script: `scripts/mongo-init.js`
- Creates collections and indexes for users, transactions, budgets, loans, goals, conversations, and bank connections

**TimescaleDB**:
- Port: 5432
- Initialization script: `scripts/timescale-init.sql`
- Creates hypertables for time-series transaction data
- Includes continuous aggregates for daily spending
- Retention policy: 2 years

**Redis**:
- Port: 6379
- Password protected
- Persistence enabled with AOF

### 1.3 Event Bus Setup ✅

**Status**: Complete

**Kafka**:
- Internal port: 9092 (for services)
- External port: 9093 (for localhost)
- Auto-create topics enabled
- Single broker setup for development

**Zookeeper**:
- Port: 2181
- Required for Kafka coordination

### 1.4 Environment Variables & Secrets Management ✅

**Status**: Complete

**Files**:
- `.env.example` - Template for environment variables
- `services/shared/.env.example` - Service-specific template
- `services/shared/config/secrets.ts` - Secrets management utility

**Features**:
- Centralized secrets loading
- Validation of required variables
- Type-safe configuration
- Production security checks

**Usage**:
```typescript
import { getSecrets } from '@kharchabuddy/shared';

const secrets = getSecrets();
console.log(secrets.mongoUri);
```

### 1.5 CI/CD Pipeline ✅

**Status**: Complete

**Files**:
- `.github/workflows/ci.yml` - Continuous Integration
- `.github/workflows/cd.yml` - Continuous Deployment

**CI Pipeline**:
1. Lint code with ESLint
2. Run unit tests with coverage
3. Run integration tests
4. Build all services
5. Build Docker images
6. Security scanning with Trivy
7. npm audit for vulnerabilities

**CD Pipeline**:
- **Staging**: Auto-deploy on push to `main`
- **Production**: Deploy on version tags (`v*`)
- Blue-green deployment strategy
- Database migrations
- Smoke tests
- Slack notifications
- Sentry release tracking

### 1.6 Monitoring Stack ✅

**Status**: Complete

**Prometheus**:
- Port: 9090
- Configuration: `monitoring/prometheus.yml`
- Scrapes metrics from all services
- 15-second scrape interval

**Grafana**:
- Port: 3001
- Default credentials: admin/admin123
- Pre-configured Prometheus datasource
- Dashboard provisioning ready

**Metrics Endpoints**:
All services expose metrics at `/metrics` endpoint:
- auth-service: 3000
- expense-service: 3001
- budget-service: 3002
- ai-cfo-service: 3003
- prediction-engine: 3004
- social-finance-service: 3005
- wealth-builder-service: 3006
- tax-optimizer-service: 3007
- integration-service: 3008

### 1.7 Error Tracking (Sentry) ✅

**Status**: Complete

**File**: `services/shared/monitoring/sentry.ts`

**Features**:
- Automatic error capture
- Performance monitoring
- Profiling integration
- User context tracking
- Breadcrumb logging
- Express middleware
- Error filtering (validation, auth errors excluded)

**Usage**:
```typescript
import { initSentry, captureException, setUser } from '@kharchabuddy/shared';

// Initialize in your service
initSentry({ serviceName: 'auth-service' });

// Set user context
setUser({ id: '123', email: 'user@example.com' });

// Capture exception
try {
  // ... code
} catch (error) {
  captureException(error, { context: 'additional info' });
}
```

### 1.8 Logging Infrastructure ✅

**Status**: Complete

**File**: `services/shared/logging/logger.ts`

**Features**:
- High-performance JSON logging with Pino
- Structured logging
- Sensitive data redaction
- Pretty print for development
- Request/response logging
- Database query logging
- External API call logging
- Event bus message logging
- ML prediction logging
- Cache operation logging

**Usage**:
```typescript
import { logger, createChildLogger, logHttpRequest } from '@kharchabuddy/shared';

// Basic logging
logger.info('Service started');
logger.error({ err: error }, 'Operation failed');

// Child logger with context
const userLogger = createChildLogger({ userId: '123' });
userLogger.info('User action performed');

// HTTP request logging (middleware)
app.use(requestLoggingMiddleware());
```

## Shared Libraries

### Installation

```bash
cd services/shared
npm install
npm run build
```

### Usage in Services

Add to service's `package.json`:
```json
{
  "dependencies": {
    "@kharchabuddy/shared": "file:../shared"
  }
}
```

Import in service code:
```typescript
import { 
  getSecrets, 
  logger, 
  initSentry,
  captureException 
} from '@kharchabuddy/shared';
```

## Security Considerations

1. **Secrets Management**:
   - Never commit `.env` files
   - Use strong JWT secrets (min 32 characters)
   - Rotate secrets regularly
   - Use AWS Secrets Manager or similar in production

2. **Database Security**:
   - Change default passwords
   - Enable authentication
   - Use SSL/TLS connections in production
   - Implement row-level security

3. **Network Security**:
   - Use internal Docker network for service communication
   - Expose only necessary ports
   - Implement rate limiting
   - Use API Gateway for external access

4. **Monitoring**:
   - Set up alerts for critical metrics
   - Monitor error rates
   - Track performance degradation
   - Review Sentry errors regularly

## Next Steps

Phase 1 infrastructure is complete. Next phases:

- **Phase 2**: Core Backend Architecture
  - Microservices structure
  - API Gateway
  - Shared libraries expansion
  - Database connection pooling

- **Phase 3**: Event-Driven Architecture
  - Event schemas
  - Publisher/consumer framework
  - Dead letter queues
  - Event replay

## Troubleshooting

### Docker Compose Issues

```bash
# Reset all containers and volumes
docker-compose down -v
docker-compose up -d

# Check service logs
docker-compose logs -f [service-name]

# Check service health
docker-compose ps
```

### Database Connection Issues

```bash
# Test MongoDB connection
docker exec -it kharchabuddy-mongodb mongosh -u admin -p password123

# Test TimescaleDB connection
docker exec -it kharchabuddy-timescaledb psql -U postgres -d kharchabuddy_timeseries

# Test Redis connection
docker exec -it kharchabuddy-redis redis-cli -a redis123
```

### Kafka Issues

```bash
# List topics
docker exec -it kharchabuddy-kafka kafka-topics --list --bootstrap-server localhost:9092

# Create topic manually
docker exec -it kharchabuddy-kafka kafka-topics --create --topic test --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1
```

## Support

For issues or questions, contact the DevOps team or create an issue in the repository.
