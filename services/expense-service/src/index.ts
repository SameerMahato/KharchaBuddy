import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database';
import { initializeKafka } from './config/kafka';
import { initializeRedis } from './config/redis';
import { logger } from '@kharchabuddy/shared';
import { errorHandler } from '@kharchabuddy/shared';
import transactionRoutes from './routes/transaction.routes';
import categoryRoutes from './routes/category.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'expense-service' });
});

// Routes
app.use('/api/v1/transactions', transactionRoutes);
app.use('/api/v1/categories', categoryRoutes);

// Error handling
app.use(errorHandler);

// Initialize connections and start server
async function startServer() {
  try {
    await connectDatabase();
    await initializeRedis();
    await initializeKafka();

    app.listen(PORT, () => {
      logger.info(`Expense Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
