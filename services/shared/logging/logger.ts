/**
 * Logging Infrastructure using Pino
 * High-performance JSON logging with structured data
 */

import pino from 'pino';
import { getSecrets } from '../config/secrets';

interface LoggerConfig {
  level?: string;
  format?: 'json' | 'pretty';
  serviceName?: string;
}

/**
 * Create logger instance
 */
export function createLogger(config?: LoggerConfig): pino.Logger {
  const secrets = getSecrets();
  
  const logLevel = config?.level || secrets.logLevel;
  const logFormat = config?.format || secrets.logFormat;
  const serviceName = config?.serviceName || secrets.serviceName;

  // Pretty print for development
  const prettyPrint = logFormat === 'pretty' && secrets.nodeEnv === 'development';

  const logger = pino({
    level: logLevel,
    
    // Base fields included in every log
    base: {
      service: serviceName,
      environment: secrets.nodeEnv,
      pid: process.pid,
      hostname: process.env.HOSTNAME || 'unknown',
    },
    
    // Timestamp format
    timestamp: pino.stdTimeFunctions.isoTime,
    
    // Pretty print for development
    transport: prettyPrint
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
    
    // Serializers for common objects
    serializers: {
      req: pino.stdSerializers.req,
      res: pino.stdSerializers.res,
      err: pino.stdSerializers.err,
    },
    
    // Redact sensitive fields
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'password',
        'token',
        'accessToken',
        'refreshToken',
        'apiKey',
        'secret',
        'creditCard',
        'ssn',
      ],
      censor: '[REDACTED]',
    },
  });

  return logger;
}

/**
 * Default logger instance
 */
export const logger = createLogger();

/**
 * Create child logger with additional context
 */
export function createChildLogger(context: Record<string, any>): pino.Logger {
  return logger.child(context);
}

/**
 * Log request/response for HTTP endpoints
 */
export function logHttpRequest(req: any, res: any, duration: number): void {
  const logData = {
    method: req.method,
    url: req.url,
    statusCode: res.statusCode,
    duration,
    userAgent: req.headers['user-agent'],
    ip: req.ip || req.connection.remoteAddress,
    userId: req.user?.id,
  };

  if (res.statusCode >= 500) {
    logger.error(logData, 'HTTP request failed');
  } else if (res.statusCode >= 400) {
    logger.warn(logData, 'HTTP request error');
  } else {
    logger.info(logData, 'HTTP request completed');
  }
}

/**
 * Log database query
 */
export function logDatabaseQuery(query: string, duration: number, error?: Error): void {
  const logData = {
    query,
    duration,
    error: error ? pino.stdSerializers.err(error) : undefined,
  };

  if (error) {
    logger.error(logData, 'Database query failed');
  } else if (duration > 1000) {
    logger.warn(logData, 'Slow database query');
  } else {
    logger.debug(logData, 'Database query executed');
  }
}

/**
 * Log external API call
 */
export function logExternalApiCall(
  service: string,
  endpoint: string,
  method: string,
  statusCode: number,
  duration: number,
  error?: Error
): void {
  const logData = {
    service,
    endpoint,
    method,
    statusCode,
    duration,
    error: error ? pino.stdSerializers.err(error) : undefined,
  };

  if (error || statusCode >= 500) {
    logger.error(logData, 'External API call failed');
  } else if (statusCode >= 400) {
    logger.warn(logData, 'External API call error');
  } else {
    logger.info(logData, 'External API call completed');
  }
}

/**
 * Log event bus message
 */
export function logEventBusMessage(
  topic: string,
  event: string,
  messageId: string,
  success: boolean,
  error?: Error
): void {
  const logData = {
    topic,
    event,
    messageId,
    success,
    error: error ? pino.stdSerializers.err(error) : undefined,
  };

  if (error) {
    logger.error(logData, 'Event bus message failed');
  } else {
    logger.info(logData, 'Event bus message processed');
  }
}

/**
 * Log ML model prediction
 */
export function logMlPrediction(
  modelName: string,
  userId: string,
  predictionType: string,
  confidence: number,
  duration: number,
  error?: Error
): void {
  const logData = {
    modelName,
    userId,
    predictionType,
    confidence,
    duration,
    error: error ? pino.stdSerializers.err(error) : undefined,
  };

  if (error) {
    logger.error(logData, 'ML prediction failed');
  } else if (confidence < 0.5) {
    logger.warn(logData, 'Low confidence ML prediction');
  } else {
    logger.info(logData, 'ML prediction completed');
  }
}

/**
 * Log cache operation
 */
export function logCacheOperation(
  operation: 'get' | 'set' | 'delete',
  key: string,
  hit: boolean,
  duration: number,
  error?: Error
): void {
  const logData = {
    operation,
    key,
    hit,
    duration,
    error: error ? pino.stdSerializers.err(error) : undefined,
  };

  if (error) {
    logger.error(logData, 'Cache operation failed');
  } else {
    logger.debug(logData, 'Cache operation completed');
  }
}

/**
 * Express middleware for request logging
 */
export function requestLoggingMiddleware() {
  return (req: any, res: any, next: any) => {
    const startTime = Date.now();
    
    // Log request
    logger.info({
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress,
    }, 'Incoming request');
    
    // Log response
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      logHttpRequest(req, res, duration);
    });
    
    next();
  };
}

/**
 * Flush logs before shutdown
 */
export function flushLogs(): Promise<void> {
  return new Promise((resolve) => {
    logger.flush(() => {
      resolve();
    });
  });
}

export default logger;
