import { Request, Response, NextFunction } from 'express';
import { RateLimitError } from '../utils/errors';
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD
});

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
}

export function rateLimit(options: RateLimitOptions) {
  const {
    windowMs = 60000, // 1 minute
    maxRequests = 100,
    keyGenerator = (req) => req.user?.userId || req.ip
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = `ratelimit:${keyGenerator(req)}`;
      const now = Date.now();
      const windowStart = now - windowMs;

      // Remove old entries
      await redis.zremrangebyscore(key, 0, windowStart);

      // Count requests in current window
      const requestCount = await redis.zcard(key);

      if (requestCount >= maxRequests) {
        // Get time until window resets
        const oldestRequest = await redis.zrange(key, 0, 0, 'WITHSCORES');
        const resetTime = oldestRequest.length > 0 
          ? parseInt(oldestRequest[1]) + windowMs 
          : now + windowMs;
        const retryAfter = Math.ceil((resetTime - now) / 1000);

        res.setHeader('X-RateLimit-Limit', maxRequests.toString());
        res.setHeader('X-RateLimit-Remaining', '0');
        res.setHeader('X-RateLimit-Reset', resetTime.toString());
        res.setHeader('Retry-After', retryAfter.toString());

        throw new RateLimitError(`Too many requests. Retry after ${retryAfter} seconds`);
      }

      // Add current request
      await redis.zadd(key, now, `${now}-${Math.random()}`);
      await redis.expire(key, Math.ceil(windowMs / 1000));

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', (maxRequests - requestCount - 1).toString());
      res.setHeader('X-RateLimit-Reset', (now + windowMs).toString());

      next();
    } catch (error) {
      next(error);
    }
  };
}

// Predefined rate limiters
export const apiRateLimit = rateLimit({
  windowMs: 60000, // 1 minute
  maxRequests: 100
});

export const authRateLimit = rateLimit({
  windowMs: 900000, // 15 minutes
  maxRequests: 5,
  keyGenerator: (req) => req.ip
});

export const strictRateLimit = rateLimit({
  windowMs: 60000, // 1 minute
  maxRequests: 10
});
