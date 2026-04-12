import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import morgan from 'morgan';

// Custom token for user ID
morgan.token('user-id', (req: any) => req.user?.userId || 'anonymous');

// Request/Response logging
export const requestLogger = morgan(
  ':method :url :status :response-time ms - :user-id',
  {
    stream: {
      write: (message: string) => logger.info(message.trim())
    }
  }
);

// Detailed request logging middleware
export const detailedLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  // Log request
  logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    headers: {
      'user-agent': req.headers['user-agent'],
      'content-type': req.headers['content-type']
    },
    query: req.query,
    userId: (req as any).user?.userId
  });

  // Capture response
  const originalSend = res.send;
  res.send = function (data: any) {
    const duration = Date.now() - startTime;
    
    logger.info('Outgoing response', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: (req as any).user?.userId
    });

    return originalSend.call(this, data);
  };

  next();
};

// Error logging middleware
export const errorLogger = (err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Request error', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    userId: (req as any).user?.userId
  });

  next(err);
};
