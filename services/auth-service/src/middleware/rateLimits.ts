import { rateLimit } from '@kharchabuddy/shared';

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5
});
