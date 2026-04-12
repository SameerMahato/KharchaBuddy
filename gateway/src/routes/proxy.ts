import { Router } from 'express';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import { serviceConfig, ServiceName } from '../config/services';
import { authMiddleware, optionalAuth } from '../middleware/auth.middleware';
import { loadBalancer } from '../services/loadBalancer';
import { logger } from '../utils/logger';

const router = Router();

// Create proxy for each service
function createServiceProxy(serviceName: ServiceName, requireAuth: boolean = true) {
  const config = serviceConfig[serviceName];
  
  const proxyOptions: Options = {
    target: config.url,
    changeOrigin: true,
    pathRewrite: {
      [`^/api/v1/${serviceName}`]: config.path
    },
    router: () => {
      // Use load balancer to get service URL
      return loadBalancer.getServiceUrl(serviceName);
    },
    onProxyReq: (proxyReq, req: any) => {
      // Forward user info to downstream services
      if (req.user) {
        proxyReq.setHeader('X-User-Id', req.user.userId);
        proxyReq.setHeader('X-User-Email', req.user.email);
      }
      
      logger.debug(`Proxying ${req.method} ${req.path} to ${serviceName}`);
    },
    onProxyRes: (proxyRes, req, res) => {
      logger.debug(`Response from ${serviceName}: ${proxyRes.statusCode}`);
    },
    onError: (err, req, res) => {
      logger.error(`Proxy error for ${serviceName}:`, err);
      (res as any).status(502).json({
        success: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: `${serviceName} service is currently unavailable`
        }
      });
    }
  };

  const middleware = requireAuth ? authMiddleware : optionalAuth;
  
  return [middleware, createProxyMiddleware(proxyOptions)];
}

// Auth service (no auth required for login/register)
router.use('/api/v1/auth', ...createServiceProxy('auth', false));

// Expense service
router.use('/api/v1/expenses', ...createServiceProxy('expense'));
router.use('/api/v1/transactions', ...createServiceProxy('expense'));
router.use('/api/v1/categories', ...createServiceProxy('expense'));

// Budget service
router.use('/api/v1/budgets', ...createServiceProxy('budget'));

// AI CFO service
router.use('/api/v1/ai-cfo', ...createServiceProxy('aiCfo'));
router.use('/api/v1/conversations', ...createServiceProxy('aiCfo'));

// Prediction service
router.use('/api/v1/predictions', ...createServiceProxy('prediction'));
router.use('/api/v1/forecasts', ...createServiceProxy('prediction'));

// Social Finance service
router.use('/api/v1/loans', ...createServiceProxy('socialFinance'));
router.use('/api/v1/trust-scores', ...createServiceProxy('socialFinance'));

// Wealth Builder service
router.use('/api/v1/goals', ...createServiceProxy('wealthBuilder'));
router.use('/api/v1/savings', ...createServiceProxy('wealthBuilder'));
router.use('/api/v1/investments', ...createServiceProxy('wealthBuilder'));

// Tax Optimizer service
router.use('/api/v1/tax', ...createServiceProxy('taxOptimizer'));

// Integration service
router.use('/api/v1/integrations', ...createServiceProxy('integration'));
router.use('/api/v1/banks', ...createServiceProxy('integration'));

export default router;
