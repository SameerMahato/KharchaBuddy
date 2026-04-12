import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { createClient } from 'redis';
import dotenv from 'dotenv';
import cron from 'node-cron';
import { SocialFinanceService } from './services/socialFinanceService';
import { SocialFinanceController } from './controllers/socialFinanceController';
import { createSocialFinanceRoutes } from './routes/socialFinanceRoutes';
import Loan from './models/Loan';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3005;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Database connections
let socialFinanceService: SocialFinanceService;

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

  // Initialize services
  socialFinanceService = new SocialFinanceService(redisClient);

  // Setup routes
  const socialFinanceController = new SocialFinanceController(socialFinanceService);
  app.use('/api/social-finance', createSocialFinanceRoutes(socialFinanceController));

  // Setup daily reminder check cron job
  const reminderSchedule = process.env.REMINDER_CHECK_SCHEDULE || '0 9 * * *'; // 9 AM daily
  cron.schedule(reminderSchedule, async () => {
    console.log('🔔 Checking for loan reminders...');
    
    const overdueLoans = await Loan.find({
      isPaidBack: false,
      expectedReturnDate: { $lt: new Date() },
      'reminderConfig.frequency': { $exists: true }
    });

    for (const loan of overdueLoans) {
      await socialFinanceService.scheduleReminder(loan);
    }

    console.log(`✅ Processed ${overdueLoans.length} reminder(s)`);
  });
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'social-finance' });
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
      console.log(`🚀 Social Finance Service running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to start service:', err);
    process.exit(1);
  });

export default app;
