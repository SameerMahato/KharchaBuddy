# API Gateway

Production-ready API Gateway for KharchaBuddy AI Financial Operating System.

## Features

- **Load Balancing**: Round-robin load balancing across service instances
- **Rate Limiting**: 100 requests/minute per user (configurable)
- **Authentication**: JWT verification middleware
- **Service Routing**: Routes to all 9 microservices
- **Request/Response Logging**: Comprehensive logging with Winston
- **Error Handling**: Centralized error handling
- **CORS Configuration**: Configurable CORS settings
- **Health Check Aggregation**: Monitor all services health
- **Security**: Helmet.js security headers
- **Redis-backed Rate Limiting**: Distributed rate limiting

## Architecture

```
Client → API Gateway → [Load Balancer] → Microservices
                ↓
            [Redis Cache]
```

## Services Routing

| Route | Service | Auth Required |
|-------|---------|---------------|
| `/api/v1/auth/*` | Auth Service | No |
| `/api/v1/expenses/*` | Expense Service | Yes |
| `/api/v1/transactions/*` | Expense Service | Yes |
| `/api/v1/budgets/*` | Budget Service | Yes |
| `/api/v1/ai-cfo/*` | AI CFO Service | Yes |
| `/api/v1/predictions/*` | Prediction Engine | Yes |
| `/api/v1/loans/*` | Social Finance | Yes |
| `/api/v1/goals/*` | Wealth Builder | Yes |
| `/api/v1/tax/*` | Tax Optimizer | Yes |
| `/api/v1/integrations/*` | Integration Service | Yes |

## Configuration

Copy `.env.example` to `.env` and configure:

```env
PORT=3000
JWT_SECRET=your-secret-key
REDIS_HOST=localhost
REDIS_PORT=6379
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000
```

## Running

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## Health Checks

- Gateway health: `GET /health`
- All services health: `GET /health/services`
- Specific service: `GET /health/services/:serviceName`

## Rate Limiting

- Default: 100 requests/minute per user
- Auth endpoints: 5 attempts/15 minutes per IP
- Uses Redis for distributed rate limiting

## Load Balancing

- Round-robin algorithm
- Automatic health checks every 30 seconds
- Fallback to unhealthy instances if all are down

## Security

- Helmet.js security headers
- CORS configuration
- JWT authentication
- Input validation
- Request size limits (10MB)

## Monitoring

- Request/response logging
- Error tracking
- Service health monitoring
- Performance metrics
