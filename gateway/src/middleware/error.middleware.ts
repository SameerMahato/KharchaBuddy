import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface APIError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export const errorHandler = (
  err: APIError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_SERVER_ERROR';

  logger.error('Error handler caught:', {
    error: err.message,
    stack: err.stack,
    statusCode,
    code,
    path: req.path,
    method: req.method
  });

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message: err.message || 'An unexpected error occurred',
      ...(process.env.NODE_ENV === 'development' && { 
        stack: err.stack,
        details: err.details 
      })
    },
    metadata: {
      timestamp: new Date(),
      path: req.path,
      method: req.method
    }
  });
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`
    }
  });
};
