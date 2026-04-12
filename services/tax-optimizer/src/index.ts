import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { TaxOptimizerService } from './services/taxOptimizerService';
import { TaxOptimizerController } from './controllers/taxOptimizerController';
import { createTaxOptimizerRoutes } from './routes/taxOptimizerRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3007;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

async function initializeServices() {
  // MongoDB
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kharcha_buddy');
  console.log('✅ Connected to MongoDB');

  // Initialize services
  const taxOptimizerService = new TaxOptimizerService();

  // Setup routes
  const taxOptimizerController = new TaxOptimizerController(taxOptimizerService);
  app.use('/api/tax', createTaxOptimizerRoutes(taxOptimizerController));
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'tax-optimizer' });
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
      console.log(`🚀 Tax Optimizer Service running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to start service:', err);
    process.exit(1);
  });

export default app;
