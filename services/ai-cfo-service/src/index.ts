import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import { createClient } from 'redis';
import { Kafka } from 'kafkajs';
import { register } from 'prom-client';
import chatRoutes from './routes/chatRoutes';
import briefRoutes from './routes/briefRoutes';
import memoryRoutes from './routes/memoryRoutes';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3004;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'ai-cfo-service', timestamp: new Date().toISOString() });
});

// Metrics
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Routes
app.use('/api/chat', chatRoutes);
app.use('/api/brief', briefRoutes);
app.use('/api/memory', memoryRoutes);

// Error handling
app.use(errorHandler);

// Initialize connections
async function initializeConnections() {
  try {
    // MongoDB
    const mongoClient = new MongoClient(process.env.MONGODB_URI!);
    await mongoClient.connect();
    logger.info('Connected to MongoDB');
    (global as any).mongoClient = mongoClient;

    // Redis
    const redisClient = createClient({ url: process.env.REDIS_URL });
    await redisClient.connect();
    logger.info('Connected to Redis');
    (global as any).redisClient = redisClient;

    // Kafka
    const kafka = new Kafka({
      clientId: process.env.KAFKA_CLIENT_ID || 'ai-cfo-service',
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    });
    const producer = kafka.producer();
    await producer.connect();
    logger.info('Connected to Kafka');
    (global as any).kafkaProducer = producer;

  } catch (error) {
    logger.error('Failed to initialize connections:', error);
    process.exit(1);
  }
}

// Start server
async function start() {
  await initializeConnections();
  
  app.listen(PORT, () => {
    logger.info(`AI CFO Service running on port ${PORT}`);
  });
}

start();

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  const mongoClient = (global as any).mongoClient;
  const redisClient = (global as any).redisClient;
  const kafkaProducer = (global as any).kafkaProducer;
  
  await mongoClient?.close();
  await redisClient?.quit();
  await kafkaProducer?.disconnect();
  process.exit(0);
});
