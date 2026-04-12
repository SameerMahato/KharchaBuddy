import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { createClient } from 'redis';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import cron from 'node-cron';
import { PredictionService } from './services/predictionService';
import { PredictionController } from './controllers/predictionController';
import { createPredictionRoutes } from './routes/predictionRoutes';
import { TimeSeriesDataStore } from './models/TimeSeriesData';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3004;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Database connections
let predictionService: PredictionService;

async function initializeServices() {
  // MongoDB
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kharcha_buddy');
  console.log('✅ Connected to MongoDB');

  // Redis
  const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  });
  await redisClient.connect();
  console.log('✅ Connected to Redis');

  // TimescaleDB
  const timescalePool = new Pool({
    host: process.env.TIMESCALE_HOST || 'localhost',
    port: parseInt(process.env.TIMESCALE_PORT || '5432'),
    database: process.env.TIMESCALE_DATABASE || 'kharcha_timeseries',
    user: process.env.TIMESCALE_USER || 'postgres',
    password: process.env.TIMESCALE_PASSWORD || 'postgres'
  });
  console.log('✅ Connected to TimescaleDB');

  const timeSeriesStore = new TimeSeriesDataStore(timescalePool);
  await timeSeriesStore.initialize();
  console.log('✅ Initialized TimescaleDB hypertable');

  // Initialize services
  predictionService = new PredictionService(timeSeriesStore, redisClient);

  // Setup routes
  const predictionController = new PredictionController(predictionService);
  app.use('/api/predictions', createPredictionRoutes(predictionController));

  // Setup weekly retraining cron job
  const retrainingSchedule = process.env.RETRAINING_SCHEDULE || '0 2 * * 0'; // Sunday 2 AM
  cron.schedule(retrainingSchedule, async () => {
    console.log('🔄 Running weekly model retraining...');
    // Retraining logic would go here
  });
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'prediction-engine' });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: err.message
    }
  });
});

// Start server
initializeServices()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Prediction Engine Service running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to start service:', err);
    process.exit(1);
  });

export default app;
