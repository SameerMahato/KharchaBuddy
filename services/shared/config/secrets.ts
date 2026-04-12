/**
 * Secrets Management Utility
 * Handles loading and validating environment variables
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

interface SecretsConfig {
  // Service
  nodeEnv: string;
  serviceName: string;
  servicePort: number;

  // Database
  mongoUri: string;
  timescaleUri: string;

  // Cache
  redisHost: string;
  redisPort: number;
  redisPassword: string;

  // Event Bus
  kafkaBrokers: string;
  kafkaClientId: string;
  kafkaGroupId: string;

  // Authentication
  jwtSecret: string;
  jwtRefreshSecret: string;
  jwtExpiresIn: string;
  jwtRefreshExpiresIn: string;

  // Monitoring
  prometheusPort: number;
  metricsEnabled: boolean;

  // Logging
  logLevel: string;
  logFormat: string;

  // Sentry
  sentryDsn?: string;
  sentryEnvironment: string;
  sentryTracesSampleRate: number;
}

/**
 * Get required environment variable or throw error
 */
function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

/**
 * Get optional environment variable with default
 */
function getOptionalEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

/**
 * Load and validate secrets configuration
 */
export function loadSecrets(): SecretsConfig {
  return {
    // Service
    nodeEnv: getOptionalEnv('NODE_ENV', 'development'),
    serviceName: getOptionalEnv('SERVICE_NAME', 'unknown-service'),
    servicePort: parseInt(getOptionalEnv('SERVICE_PORT', '3000'), 10),

    // Database
    mongoUri: getRequiredEnv('MONGO_URI'),
    timescaleUri: getRequiredEnv('TIMESCALE_URI'),

    // Cache
    redisHost: getOptionalEnv('REDIS_HOST', 'redis'),
    redisPort: parseInt(getOptionalEnv('REDIS_PORT', '6379'), 10),
    redisPassword: getRequiredEnv('REDIS_PASSWORD'),

    // Event Bus
    kafkaBrokers: getOptionalEnv('KAFKA_BROKERS', 'kafka:9092'),
    kafkaClientId: getOptionalEnv('KAFKA_CLIENT_ID', 'kharchabuddy-service'),
    kafkaGroupId: getOptionalEnv('KAFKA_GROUP_ID', 'kharchabuddy-consumers'),

    // Authentication
    jwtSecret: getRequiredEnv('JWT_SECRET'),
    jwtRefreshSecret: getRequiredEnv('JWT_REFRESH_SECRET'),
    jwtExpiresIn: getOptionalEnv('JWT_EXPIRES_IN', '15m'),
    jwtRefreshExpiresIn: getOptionalEnv('JWT_REFRESH_EXPIRES_IN', '7d'),

    // Monitoring
    prometheusPort: parseInt(getOptionalEnv('PROMETHEUS_PORT', '9090'), 10),
    metricsEnabled: getOptionalEnv('METRICS_ENABLED', 'true') === 'true',

    // Logging
    logLevel: getOptionalEnv('LOG_LEVEL', 'info'),
    logFormat: getOptionalEnv('LOG_FORMAT', 'json'),

    // Sentry
    sentryDsn: process.env.SENTRY_DSN,
    sentryEnvironment: getOptionalEnv('SENTRY_ENVIRONMENT', 'development'),
    sentryTracesSampleRate: parseFloat(getOptionalEnv('SENTRY_TRACES_SAMPLE_RATE', '0.1')),
  };
}

/**
 * Validate secrets configuration
 */
export function validateSecrets(config: SecretsConfig): void {
  // Validate JWT secrets are strong enough
  if (config.jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }
  if (config.jwtRefreshSecret.length < 32) {
    throw new Error('JWT_REFRESH_SECRET must be at least 32 characters long');
  }

  // Validate production environment has Sentry configured
  if (config.nodeEnv === 'production' && !config.sentryDsn) {
    console.warn('WARNING: SENTRY_DSN not configured in production environment');
  }

  // Validate log level
  const validLogLevels = ['error', 'warn', 'info', 'debug', 'trace'];
  if (!validLogLevels.includes(config.logLevel)) {
    throw new Error(`Invalid LOG_LEVEL: ${config.logLevel}. Must be one of: ${validLogLevels.join(', ')}`);
  }
}

// Export singleton instance
let secretsInstance: SecretsConfig | null = null;

export function getSecrets(): SecretsConfig {
  if (!secretsInstance) {
    secretsInstance = loadSecrets();
    validateSecrets(secretsInstance);
  }
  return secretsInstance;
}

export default getSecrets;
