import Redis from 'ioredis';
import { logger } from '@kharchabuddy/shared';

let redisClient: Redis;

export async function connectRedis(): Promise<void> {
  redisClient = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || 'redis123',
  });

  redisClient.on('connect', () => {
    logger.info('Budget Service connected to Redis');
  });

  redisClient.on('error', (error) => {
    logger.error({ err: error }, 'Redis connection error');
  });
}

export function getRedisClient(): Redis {
  return redisClient;
}
