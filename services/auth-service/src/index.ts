import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { logger, errorHandler, notFoundHandler } from '@kharchabuddy/shared';
import { setupMetrics } from './metrics';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';

const app = express();
const PORT = process.env.AUTH_SERVICE_PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Metrics
setupMetrics(app);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'auth-service', timestamp: new Date() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Database connection
async function connectDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    logger.info('Auth service connected to MongoDB');
  } catch (error) {
    logger.error('Failed to connect to MongoDB', { error });
    process.exit(1);
  }
}

// Start server
async function start() {
  await connectDatabase();
  
  app.listen(PORT, () => {
    logger.info(`Auth service listening on port ${PORT}`);
  });
}

start();

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await mongoose.connection.close();
  process.exit(0);
});
