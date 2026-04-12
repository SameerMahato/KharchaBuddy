import express from 'express';
import { logger, initSentry } from '@kharchabuddy/shared';
import { connectDatabase } from './config/database';
import { connectKafka, consumeEvents } from './config/kafka';
import { connectRedis } from './config/redis';
import budgetRoutes from './routes/budget.routes';
import nudgeRoutes from './routes/nudge.routes';

const app = express();
const PORT = process.env.PORT || 3002;

// Initialize Sentry
initSentry({ serviceName: 'budget-service' });

// Middleware
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'budget-service' });
});

// Routes
app.use('/api/budgets', budgetRoutes);
app.use('/api/nudges', nudgeRoutes);

// Start server
async function start() {
  try {
    await connectDatabase();
    await connectRedis();
    await connectKafka();
    await consumeEvents();

    app.listen(PORT, () => {
      logger.info(`Budget Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to start Budget Service');
    process.exit(1);
  }
}

start();
