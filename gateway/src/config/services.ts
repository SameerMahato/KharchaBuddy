export const serviceConfig = {
  auth: {
    url: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    path: '/api/v1/auth',
    healthCheck: '/health'
  },
  expense: {
    url: process.env.EXPENSE_SERVICE_URL || 'http://localhost:3002',
    path: '/api/v1',
    healthCheck: '/health'
  },
  budget: {
    url: process.env.BUDGET_SERVICE_URL || 'http://localhost:3003',
    path: '/api/v1',
    healthCheck: '/health'
  },
  aiCfo: {
    url: process.env.AI_CFO_SERVICE_URL || 'http://localhost:3004',
    path: '/api/v1',
    healthCheck: '/health'
  },
  prediction: {
    url: process.env.PREDICTION_SERVICE_URL || 'http://localhost:3005',
    path: '/api/v1',
    healthCheck: '/health'
  },
  socialFinance: {
    url: process.env.SOCIAL_FINANCE_SERVICE_URL || 'http://localhost:3006',
    path: '/api/v1',
    healthCheck: '/health'
  },
  wealthBuilder: {
    url: process.env.WEALTH_BUILDER_SERVICE_URL || 'http://localhost:3007',
    path: '/api/v1',
    healthCheck: '/health'
  },
  taxOptimizer: {
    url: process.env.TAX_OPTIMIZER_SERVICE_URL || 'http://localhost:3008',
    path: '/api/v1',
    healthCheck: '/health'
  },
  integration: {
    url: process.env.INTEGRATION_SERVICE_URL || 'http://localhost:3009',
    path: '/api/v1',
    healthCheck: '/health'
  }
};

export type ServiceName = keyof typeof serviceConfig;
