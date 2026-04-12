import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { APIResponse } from '../types';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log error
  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: (req as any).user?.id
  });

  // Handle known operational errors
  if (err instanceof AppError) {
    const response: APIResponse = {
      success: false,
      error: {
        code: err.code,
        message: err.message
      },
      metadata: {
        timestamp: new Date(),
        requestId: req.headers['x-request-id'] as string || 'unknown',
        version: 'v1'
      }
    };

    return res.status(err.statusCode).json(response);
  }

  // Handle unknown errors
  const response: APIResponse = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred' 
        : err.message
    },
    metadata: {
      timestamp: new Date(),
      requestId: req.headers['x-request-id'] as string || 'unknown',
      version: 'v1'
    }
  };

  // Send error to monitoring service (Sentry)
  if (process.env.SENTRY_DSN) {
    // Sentry.captureException(err);
  }

  res.status(500).json(response);
}

// Async error wrapper
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// 404 handler
export function notFoundHandler(req: Request, res: Response) {
  const response: APIResponse = {
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`
    },
    metadata: {
      timestamp: new Date(),
      requestId: req.headers['x-request-id'] as string || 'unknown',
      version: 'v1'
    }
  };

  res.status(404).json(response);
}
