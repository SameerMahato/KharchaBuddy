import { MongoClient } from 'mongodb';
import { logger } from '../utils/logger';

interface UserMemory {
  userId: string;
  spendingPatterns: string;
  preferences: string;
  financialPersonality: string;
  goals: string[];
  lastUpdated: Date;
}

export async function getUserMemory(userId: string): Promise<UserMemory | null> {
  try {
    const client: MongoClient = (global as any).mongoClient;
    const db = client.db('kharchabuddy');
    const memory = await db.collection('user_memory').findOne({ userId });
    return memory as UserMemory | null;
  } catch (error) {
    logger.error('Failed to get user memory', { userId, error });
    return null;
  }
}

export async function updateUserMemory(userId: string, updates: Partial<UserMemory>): Promise<void> {
  try {
    const client: MongoClient = (global as any).mongoClient;
    const db = client.db('kharchabuddy');
    
    await db.collection('user_memory').updateOne(
      { userId },
      {
        $set: {
          ...updates,
          lastUpdated: new Date(),
        },
      },
      { upsert: true }
    );
    
    logger.info('Updated user memory', { userId });
  } catch (error) {
    logger.error('Failed to update user memory', { userId, error });
    throw error;
  }
}

export async function clearUserMemory(userId: string): Promise<void> {
  try {
    const client: MongoClient = (global as any).mongoClient;
    const db = client.db('kharchabuddy');
    
    await db.collection('user_memory').deleteOne({ userId });
    logger.info('Cleared user memory', { userId });
  } catch (error) {
    logger.error('Failed to clear user memory', { userId, error });
    throw error;
  }
}
