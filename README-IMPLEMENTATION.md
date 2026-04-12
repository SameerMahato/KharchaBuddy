# KharchaBuddy AI Financial Operating System - Implementation Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- Python 3.10+ (for ML models)
- Git

### Local Development Setup

1. **Clone and Install**
```bash
git clone https://github.com/SameerMahato/KharchaBuddy.git
cd KharchaBuddy
```

2. **Set up Environment Variables**
```bash
cp .env.example .env
# Edit .env with your API keys and configuration
```

3. **Start Infrastructure Services**
```bash
docker-compose up -d
```

This will start:
- MongoDB (port 27017)
- Redis (port 6379)
- TimescaleDB (port 5432)
- Kafka + Zookeeper (ports 9092, 9093)
- Prometheus (port 9090)
- Grafana (port 3001)

4. **Verify Services**
```bash
docker-compose ps
```

5. **Access Monitoring**
- Grafana: http://localhost:3001 (admin/admin123)
- Prometheus: http://localhost:9090

### Project Structure

```
KharchaBuddy/
├── backend/                    # Existing backend
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   └── middleware/
│   └── index.js
├── frontend/                   # Existing frontend
│   └── src/
├── services/                   # New microservices
│   ├── auth-service/
│   ├── expense-service/
│   ├── budget-service/
│   ├── ai-cfo-service/
│   ├── prediction-engine/
│   ├── social-finance-service/
│   ├── wealth-builder-service/
│   ├── tax-optimizer-service/
│   └── integration-service/
├── shared/                     # Shared libraries
│   ├── types/
│   ├── utils/
│   └── middleware/
├── ml-models/                  # ML training scripts
│   ├── categorization/
│   ├── prediction/
│   └── anomaly-detection/
├── scripts/                    # Database init scripts
├── monitoring/                 # Prometheus & Grafana config
├── docker-compose.yml
└── .env.example
```

## 📋 Implementation Phases

### Phase 1: Foundation (Weeks 1-4)
✅ Infrastructure setup (Docker Compose)
- MongoDB, Redis, TimescaleDB, Kafka
- Monitoring (Prometheus, Grafana)
- Environment configuration

🔄 Next Steps:
- Set up microservices architecture
- Implement API Gateway
- Configure event bus

### Phase 2: Core Services (Weeks 5-10)
- Authentication & User Management
- Transaction Processing Pipeline
- Intelligent Expense Tracking
- Anomaly Detection System

### Phase 3: AI & ML Features (Weeks 11-16)
- AI CFO Conversational Interface
- User Memory & Personalization
- Prediction Engine
- Cash Flow Forecasting

### Phase 4: Budget & Wealth (Weeks 17-20)
- Autonomous Budget Management
- Behavioral Nudging
- Smart Saving Mode
- Round-Up Savings
- Financial Goal Management

### Phase 5: Advanced Features (Weeks 21-24)
- Social Finance Engine
- Tax Optimization
- Scenario Simulator
- Bank Integration
- UPI Integration

### Phase 6: Frontend (Weeks 25-28)
- Frontend Architecture
- Core UI Pages
- AI CFO Chat Interface
- Advanced Features UI
- Mobile Responsiveness

### Phase 7: Testing & QA (Weeks 29-31)
- Unit Testing
- Property-Based Testing
- Integration Testing
- End-to-End Testing

### Phase 8: Security & Performance (Weeks 32-34)
- Security Hardening
- Performance Optimization
- Monitoring & Observability

### Phase 9: Deployment (Weeks 35-36)
- Production Infrastructure
- Documentation
- Launch Preparation

## 🔧 Development Commands

### Infrastructure
```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f [service-name]

# Restart a service
docker-compose restart [service-name]

# Clean up volumes
docker-compose down -v
```

### Backend Development
```bash
cd backend
npm install
npm run dev
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

### Database Management
```bash
# MongoDB shell
docker exec -it kharchabuddy-mongodb mongosh -u admin -p password123

# TimescaleDB shell
docker exec -it kharchabuddy-timescaledb psql -U postgres -d kharchabuddy_timeseries

# Redis CLI
docker exec -it kharchabuddy-redis redis-cli -a redis123
```

### Kafka Management
```bash
# List topics
docker exec kharchabuddy-kafka kafka-topics --list --bootstrap-server localhost:9092

# Create topic
docker exec kharchabuddy-kafka kafka-topics --create --topic transaction.created --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1

# Consume messages
docker exec kharchabuddy-kafka kafka-console-consumer --topic transaction.created --from-beginning --bootstrap-server localhost:9092
```

## 📊 Monitoring

### Grafana Dashboards
Access Grafana at http://localhost:3001

Default dashboards:
- System Metrics (CPU, Memory, Disk)
- API Metrics (Latency, Throughput, Errors)
- Business Metrics (DAU, Transactions, Predictions)
- ML Model Metrics (Accuracy, Latency)

### Prometheus Metrics
Access Prometheus at http://localhost:9090

Key metrics:
- `http_request_duration_seconds` - API latency
- `http_requests_total` - Request count
- `transaction_processing_duration_seconds` - Transaction processing time
- `ml_prediction_accuracy` - ML model accuracy
- `anomaly_detection_rate` - Anomaly detection rate

## 🧪 Testing

### Run Tests
```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Coverage
npm run test:coverage
```

## 🔐 Security

### Environment Variables
Never commit `.env` files. Use `.env.example` as a template.

### API Keys
Store sensitive keys in environment variables or use a secrets manager.

### Database Credentials
Change default passwords in production.

## 📚 Documentation

- [API Documentation](./docs/api.md)
- [Architecture Decision Records](./docs/adr/)
- [Database Schema](./docs/schema.md)
- [Deployment Guide](./docs/deployment.md)

## 🐛 Troubleshooting

### Common Issues

**MongoDB connection failed**
```bash
# Check if MongoDB is running
docker-compose ps mongodb

# Check logs
docker-compose logs mongodb
```

**Kafka not starting**
```bash
# Ensure Zookeeper is running first
docker-compose up -d zookeeper
sleep 10
docker-compose up -d kafka
```

**Port already in use**
```bash
# Find process using port
lsof -i :5000

# Kill process
kill -9 <PID>
```

## 📞 Support

For issues and questions:
- GitHub Issues: https://github.com/SameerMahato/KharchaBuddy/issues
- Email: support@kharchabuddy.com

## 📄 License

MIT License - see LICENSE file for details
