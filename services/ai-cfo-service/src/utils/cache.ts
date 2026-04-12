import { createClient } from 'redis';
import { logger } from './logger';

export async function getCachedResponse(key: string): Promise<any | null> {
  try {
    const client = (global as any).redisClient;
    const cached = await client.get(key);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    logger.error('Cache get failed', { key, error });
    return null;
  }
}

export async function cacheResponse(key: string, value: any, ttl: number): Promise<void> {
  try {
    const client = (global as any).redisClient;
    await client.setEx(key, ttl, JSON.stringify(value));
  } catch (error) {
    logger.error('Cache set failed', { key, error });
  }
}
