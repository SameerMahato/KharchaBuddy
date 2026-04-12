import { createClient } from 'redis';
import { logger } from '../utils/logger';

const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379')
  }
});

redisClient.on('error', (err) => logger.error('Redis Client Error', err));
redisClient.on('connect', () => logger.info('Redis Client Connected'));

export async function initializeRedis() {
  await redisClient.connect();
}

export { redisClient };
