# Expense Service

Intelligent expense tracking and categorization service for the AI Financial Operating System.

## Features

- **Real-time Transaction Processing**: Ingest and process transactions within 500ms
- **Auto-categorization**: ML-powered categorization with rule-based fallback
- **Event Publishing**: Publishes transaction.created events to Kafka
- **Filtering & Pagination**: Advanced query capabilities for transactions
- **Analytics**: Spending by category aggregation
- **Category Management**: Predefined categories with feedback loop

## API Endpoints

### Transactions

- `POST /api/v1/transactions` - Create a new transaction
- `GET /api/v1/transactions` - Get transactions with filtering
- `GET /api/v1/transactions/:id` - Get a single transaction
- `PUT /api/v1/transactions/:id` - Update a transaction
- `DELETE /api/v1/transactions/:id` - Delete a transaction
- `GET /api/v1/transactions/analytics/by-category` - Get spending by category

### Categories

- `GET /api/v1/categories` - Get all categories
- `POST /api/v1/categories/categorize` - Categorize a transaction
- `POST /api/v1/categories/feedback` - Submit categorization feedback

## Environment Variables

```env
PORT=3002
NODE_ENV=development
MONGODB_URI=mongodb://admin:password123@localhost:27017/kharchabuddy
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis123
KAFKA_BROKERS=localhost:9093
KAFKA_CLIENT_ID=expense-service
KAFKA_GROUP_ID=expense-service-group
JWT_SECRET=your-secret-key-here
ML_MODEL_ENDPOINT=http://localhost:5000/predict
```

## Running the Service

```bash
# Install dependencies
npm install

# Development mode
npm run dev

# Build
npm run build

# Production mode
npm start

# Run tests
npm test
```

## Architecture

- **Database**: MongoDB for transaction storage
- **Cache**: Redis for ML predictions and hot data
- **Event Bus**: Kafka for event-driven architecture
- **ML Integration**: Placeholder for ML model endpoint

## Performance Targets

- Transaction processing: < 500ms
- API response time: < 200ms
- Categorization: < 100ms
- Event publishing: < 50ms

## Dependencies

- Express.js for HTTP server
- Mongoose for MongoDB ODM
- KafkaJS for event streaming
- Redis for caching
- Zod for validation
