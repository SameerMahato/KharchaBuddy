import { Router } from 'express';
import { loadBalancer } from '../services/loadBalancer';
import { redisClient } from '../config/redis';

const router = Router();

// Gateway health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'api-gateway',
    timestamp: new Date().toISOString()
  });
});

// Aggregated health check for all services
router.get('/health/services', async (req, res) => {
  const servicesHealth = loadBalancer.getAllServicesHealth();
  
  // Check Redis
  let redisHealthy = false;
  try {
    await redisClient.ping();
    redisHealthy = true;
  } catch (error) {
    redisHealthy = false;
  }

  const allHealthy = Object.values(servicesHealth).every(
    (service) => service.healthy > 0
  ) && redisHealthy;

  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'healthy' : 'degraded',
    services: servicesHealth,
    redis: redisHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString()
  });
});

// Detailed service health
router.get('/health/services/:serviceName', (req, res) => {
  const { serviceName } = req.params;
  
  try {
    const health = loadBalancer.getServiceHealth(serviceName as any);
    res.json({
      service: serviceName,
      ...health,
      status: health.healthy > 0 ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: {
        code: 'SERVICE_NOT_FOUND',
        message: `Service ${serviceName} not found`
      }
    });
  }
});

export default router;
