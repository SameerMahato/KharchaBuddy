/**
 * Sentry Error Tracking Configuration
 * Centralized error tracking and monitoring
 */

import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';
import { getSecrets } from '../config/secrets';

interface SentryConfig {
  dsn?: string;
  environment: string;
  tracesSampleRate: number;
  profilesSampleRate?: number;
  serviceName: string;
}

/**
 * Initialize Sentry for error tracking
 */
export function initSentry(config?: Partial<SentryConfig>): void {
  const secrets = getSecrets();
  
  const sentryConfig: SentryConfig = {
    dsn: config?.dsn || secrets.sentryDsn,
    environment: config?.environment || secrets.sentryEnvironment,
    tracesSampleRate: config?.tracesSampleRate || secrets.sentryTracesSampleRate,
    profilesSampleRate: config?.profilesSampleRate || 0.1,
    serviceName: config?.serviceName || secrets.serviceName,
  };

  // Skip initialization if DSN is not provided
  if (!sentryConfig.dsn) {
    console.warn('Sentry DSN not configured. Error tracking disabled.');
    return;
  }

  Sentry.init({
    dsn: sentryConfig.dsn,
    environment: sentryConfig.environment,
    
    // Set service name as release
    release: `${sentryConfig.serviceName}@${process.env.npm_package_version || 'unknown'}`,
    
    // Performance Monitoring
    tracesSampleRate: sentryConfig.tracesSampleRate,
    
    // Profiling
    profilesSampleRate: sentryConfig.profilesSampleRate,
    integrations: [
      new ProfilingIntegration(),
    ],
    
    // Error filtering
    beforeSend(event, hint) {
      // Filter out specific errors
      const error = hint.originalException;
      
      if (error instanceof Error) {
        // Don't send validation errors to Sentry
        if (error.name === 'ValidationError') {
          return null;
        }
        
        // Don't send authentication errors
        if (error.name === 'UnauthorizedError' || error.name === 'AuthenticationError') {
          return null;
        }
      }
      
      return event;
    },
    
    // Add custom tags
    initialScope: {
      tags: {
        service: sentryConfig.serviceName,
        nodeVersion: process.version,
      },
    },
  });

  console.log(`Sentry initialized for ${sentryConfig.serviceName} in ${sentryConfig.environment} environment`);
}

/**
 * Capture exception with context
 */
export function captureException(error: Error, context?: Record<string, any>): void {
  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Capture message with severity
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info', context?: Record<string, any>): void {
  Sentry.captureMessage(message, {
    level,
    extra: context,
  });
}

/**
 * Set user context for error tracking
 */
export function setUser(user: { id: string; email?: string; username?: string }): void {
  Sentry.setUser(user);
}

/**
 * Clear user context
 */
export function clearUser(): void {
  Sentry.setUser(null);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(breadcrumb: {
  message: string;
  category?: string;
  level?: Sentry.SeverityLevel;
  data?: Record<string, any>;
}): void {
  Sentry.addBreadcrumb(breadcrumb);
}

/**
 * Start a transaction for performance monitoring
 */
export function startTransaction(name: string, op: string): Sentry.Transaction {
  return Sentry.startTransaction({
    name,
    op,
  });
}

/**
 * Express error handler middleware
 */
export function sentryErrorHandler() {
  return Sentry.Handlers.errorHandler({
    shouldHandleError(error) {
      // Capture all errors with status code >= 500
      return error.status ? error.status >= 500 : true;
    },
  });
}

/**
 * Express request handler middleware
 */
export function sentryRequestHandler() {
  return Sentry.Handlers.requestHandler();
}

/**
 * Express tracing middleware
 */
export function sentryTracingHandler() {
  return Sentry.Handlers.tracingHandler();
}

/**
 * Flush Sentry events before shutdown
 */
export async function flushSentry(timeout: number = 2000): Promise<boolean> {
  return await Sentry.close(timeout);
}

export default {
  initSentry,
  captureException,
  captureMessage,
  setUser,
  clearUser,
  addBreadcrumb,
  startTransaction,
  sentryErrorHandler,
  sentryRequestHandler,
  sentryTracingHandler,
  flushSentry,
};
