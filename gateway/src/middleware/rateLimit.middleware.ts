import rateLimit from 'express-rate-limit';
import { redisClient } from '../config/redis';
import { logger } from '../utils/logger';

// Redis-backed rate limiter store
class RedisStore {
  private prefix: string;
  private windowMs: number;

  constructor(windowMs: number) {
    this.prefix = 'rate-limit:';
    this.windowMs = windowMs;
  }

  async increment(key: string): Promise<{ totalHits: number; resetTime: Date }> {
    const redisKey = this.prefix + key;
    const now = Date.now();
    const windowStart = now - this.windowMs;

    try {
      // Remove old entries
      await redisClient.zRemRangeByScore(redisKey, 0, windowStart);
      
      // Add current request
      await redisClient.zAdd(redisKey, { score: now, value: `${now}` });
      
      // Count requests in window
      const totalHits = await redisClient.zCount(redisKey, windowStart, now);
      
      // Set expiry
      await redisClient.expire(redisKey, Math.ceil(this.windowMs / 1000));
      
      const resetTime = new Date(now + this.windowMs);
      return { totalHits, resetTime };
    } catch (error) {
      logger.error('Redis rate limit error:', error);
      // Fallback to allowing request if Redis fails
      return { totalHits: 1, resetTime: new Date(now + this.windowMs) };
    }
  }

  async decrement(key: string): Promise<void> {
    // Not needed for our implementation
  }

  async resetKey(key: string): Promise<void> {
    const redisKey = this.prefix + key;
    await redisClient.del(redisKey);
  }
}

// Rate limiter: 100 requests per minute per user
export const rateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => {
    // Use userId if authenticated, otherwise IP
    return req.user?.userId || req.ip || 'anonymous';
  },
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for ${req.user?.userId || req.ip}`);
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.'
      }
    });
  },
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  }
});

// Stricter rate limit for auth endpoints
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  keyGenerator: (req) => req.ip || 'anonymous',
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for ${req.ip}`);
    res.status(429).json({
      success: false,
      error: {
        code: 'TOO_MANY_ATTEMPTS',
        message: 'Too many authentication attempts. Please try again later.'
      }
    });
  }
});
