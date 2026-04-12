# KharchaBuddy Microservices

This directory contains all microservices for the AI Financial Operating System.

## Services Overview

### 1. Prediction Engine Service (Port 3004)
**Purpose**: ML-powered forecasting for expenses and cash flow

**Features**:
- Expense prediction with confidence scores
- Cash flow forecasting using Monte Carlo simulation
- Recurring transaction detection
- Per-user ML model training and caching
- Weekly model retraining scheduler

**Tech Stack**: Express, MongoDB, Redis, TimescaleDB, TypeScript

**Key Endpoints**:
- `GET /api/predictions/expenses` - Predict upcoming expenses
- `POST /api/predictions/cashflow` - Generate cash flow forecast
- `GET /api/predictions/recurring` - Detect recurring transactions

---

### 2. Social Finance Service (Port 3005)
**Purpose**: Loan tracking with trust scoring and smart reminders

**Features**:
- Loan management (given/received)
- Trust score calculation (0-100 scale)
- Partial payment tracking
- Smart reminder generation with tone control
- Risk assessment for lending decisions
- Trust score caching (24 hours)

**Tech Stack**: Express, MongoDB, Redis, TypeScript

**Key Endpoints**:
- `POST /api/social-finance/loans` - Create loan
- `POST /api/social-finance/loans/:loanId/payments` - Record payment
- `GET /api/social-finance/trust-score/:friendId` - Get trust score
- `GET /api/social-finance/loans` - List loans

---

### 3. Wealth Builder Service (Port 3006)
**Purpose**: Automated savings and financial goal management

**Features**:
- Financial goal creation and tracking
- Round-up savings calculation
- Auto-contribution system
- Milestone tracking (25%, 50%, 75%, 100%)
- Goal progress calculator
- On-track analysis

**Tech Stack**: Express, MongoDB, TypeScript

**Key Endpoints**:
- `POST /api/wealth/goals` - Create financial goal
- `POST /api/wealth/goals/:goalId/contributions` - Add contribution
- `GET /api/wealth/goals/:goalId/progress` - Get goal progress
- `POST /api/wealth/roundup/process` - Process round-up
- `POST /api/wealth/roundup/configure` - Configure round-up settings

---

### 4. Tax Optimizer Service (Port 3007)
**Purpose**: India-focused tax optimization and deduction tracking

**Features**:
- Section 80C optimization (₹150,000 limit)
- Section 80D tracking (health insurance)
- Section 24B tracking (home loan interest)
- Tax liability calculation using Indian tax slabs
- Tax deadline alerts (30 days before March 31)
- Deduction suggestions sorted by tax efficiency

**Tech Stack**: Express, MongoDB, TypeScript

**Key Endpoints**:
- `POST /api/tax/analyze` - Analyze tax situation
- `GET /api/tax/optimize/80c/:financialYear` - Optimize Section 80C
- `POST /api/tax/deductions` - Track deduction
- `POST /api/tax/calculate` - Calculate tax liability
- `GET /api/tax/alerts/:financialYear` - Get tax alerts

---

### 5. Integration Service (Port 3008)
**Purpose**: Bank API and payment gateway integration

**Features**:
- Bank connection via OAuth 2.0
- Transaction sync (real-time + historical 90 days)
- Webhook handling with signature verification
- Token encryption (AES-256)
- Connection health monitoring
- Support for Setu and Finbox APIs
- Automatic retry with exponential backoff

**Tech Stack**: Express, MongoDB, Redis, Axios, Crypto, TypeScript

**Key Endpoints**:
- `POST /api/integration/banks/connect` - Connect bank account
- `POST /api/integration/banks/:connectionId/sync` - Sync transactions
- `GET /api/integration/banks/connections` - List connections
- `DELETE /api/integration/banks/:connectionId` - Disconnect bank
- `GET /api/integration/banks/:connectionId/balance` - Get balance
- `POST /api/integration/webhooks/bank` - Handle bank webhooks

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB
- Redis
- TimescaleDB (for Prediction Engine)
- Docker (optional)

### Installation

1. **Install dependencies for all services**:
```bash
cd services/prediction-engine && npm install
cd ../social-finance && npm install
cd ../wealth-builder && npm install
cd ../tax-optimizer && npm install
cd ../integration && npm install
```

2. **Configure environment variables**:
Copy `.env.example` to `.env` in each service directory and update values.

3. **Start services**:

**Development mode** (with hot reload):
```bash
# Prediction Engine
cd services/prediction-engine && npm run dev

# Social Finance
cd services/social-finance && npm run dev

# Wealth Builder
cd services/wealth-builder && npm run dev

# Tax Optimizer
cd services/tax-optimizer && npm run dev

# Integration
cd services/integration && npm run dev
```

**Production mode**:
```bash
# Build all services
cd services/prediction-engine && npm run build && npm start
cd services/social-finance && npm run build && npm start
cd services/wealth-builder && npm run build && npm start
cd services/tax-optimizer && npm run build && npm start
cd services/integration && npm run build && npm start
```

---

## Architecture

### Communication Pattern
- **Synchronous**: REST APIs for client-facing operations
- **Asynchronous**: Event bus (Kafka/RabbitMQ) for inter-service communication
- **Caching**: Redis for frequently accessed data

### Data Storage
- **MongoDB**: Primary database for all services
- **TimescaleDB**: Time-series data for Prediction Engine
- **Redis**: Caching layer (predictions, trust scores, etc.)

### Security
- JWT authentication for all endpoints
- AES-256 encryption for sensitive data (bank tokens)
- Webhook signature verification
- Rate limiting (100 req/min per user)
- Input validation using Zod

---

## Testing

Run tests for each service:
```bash
cd services/prediction-engine && npm test
cd services/social-finance && npm test
cd services/wealth-builder && npm test
cd services/tax-optimizer && npm test
cd services/integration && npm test
```

---

## Monitoring

Each service exposes:
- **Health check**: `GET /health`
- **Metrics**: Prometheus-compatible metrics (to be implemented)
- **Logging**: Structured JSON logs using Winston

---

## API Documentation

Detailed API documentation for each service is available at:
- Prediction Engine: `http://localhost:3004/api-docs`
- Social Finance: `http://localhost:3005/api-docs`
- Wealth Builder: `http://localhost:3006/api-docs`
- Tax Optimizer: `http://localhost:3007/api-docs`
- Integration: `http://localhost:3008/api-docs`

---

## Deployment

### Docker Deployment
```bash
# Build images
docker build -t prediction-engine ./services/prediction-engine
docker build -t social-finance ./services/social-finance
docker build -t wealth-builder ./services/wealth-builder
docker build -t tax-optimizer ./services/tax-optimizer
docker build -t integration ./services/integration

# Run with docker-compose
docker-compose up -d
```

### Kubernetes Deployment
Deployment manifests are available in `/k8s` directory.

---

## Performance Targets

| Service | Response Time | Throughput |
|---------|--------------|------------|
| Prediction Engine | < 200ms | 1000 req/min |
| Social Finance | < 100ms | 500 req/min |
| Wealth Builder | < 100ms | 500 req/min |
| Tax Optimizer | < 150ms | 300 req/min |
| Integration | < 500ms | 200 req/min |

---

## Contributing

1. Follow TypeScript best practices
2. Write tests for new features
3. Update API documentation
4. Follow conventional commit messages
5. Ensure all tests pass before PR

---

## License

MIT License - See LICENSE file for details
