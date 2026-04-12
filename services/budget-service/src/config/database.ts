import mongoose from 'mongoose';
import { logger } from '@kharchabuddy/shared';

export async function connectDatabase(): Promise<void> {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://admin:password123@localhost:27017/kharchabuddy?authSource=admin';

  try {
    await mongoose.connect(mongoUri);
    logger.info('Budget Service connected to MongoDB');
  } catch (error) {
    logger.error({ err: error }, 'MongoDB connection failed');
    throw error;
  }
}
