import { serviceConfig, ServiceName } from '../config/services';
import { logger } from '../utils/logger';
import axios from 'axios';

interface ServiceInstance {
  url: string;
  healthy: boolean;
  lastCheck: number;
}

class LoadBalancer {
  private instances: Map<ServiceName, ServiceInstance[]> = new Map();
  private currentIndex: Map<ServiceName, number> = new Map();
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeInstances();
    this.startHealthChecks();
  }

  private initializeInstances() {
    // Initialize with single instance per service (can be extended for multiple instances)
    Object.entries(serviceConfig).forEach(([name, config]) => {
      this.instances.set(name as ServiceName, [{
        url: config.url,
        healthy: true,
        lastCheck: Date.now()
      }]);
      this.currentIndex.set(name as ServiceName, 0);
    });
  }

  private startHealthChecks() {
    // Check health every 30 seconds
    this.healthCheckInterval = setInterval(() => {
      this.checkAllServices();
    }, 30000);
  }

  private async checkAllServices() {
    for (const [serviceName, instances] of this.instances.entries()) {
      for (const instance of instances) {
        try {
          const config = serviceConfig[serviceName];
          const healthUrl = `${instance.url}${config.healthCheck}`;
          
          const response = await axios.get(healthUrl, { timeout: 5000 });
          instance.healthy = response.status === 200;
          instance.lastCheck = Date.now();
          
          if (!instance.healthy) {
            logger.warn(`Service ${serviceName} at ${instance.url} is unhealthy`);
          }
        } catch (error) {
          instance.healthy = false;
          instance.lastCheck = Date.now();
          logger.error(`Health check failed for ${serviceName} at ${instance.url}:`, error);
        }
      }
    }
  }

  // Round-robin load balancing
  getServiceUrl(serviceName: ServiceName): string {
    const instances = this.instances.get(serviceName);
    
    if (!instances || instances.length === 0) {
      throw new Error(`No instances available for service: ${serviceName}`);
    }

    // Filter healthy instances
    const healthyInstances = instances.filter(i => i.healthy);
    
    if (healthyInstances.length === 0) {
      logger.warn(`No healthy instances for ${serviceName}, using any available`);
      // Fallback to any instance if none are healthy
      return instances[0].url;
    }

    // Round-robin selection
    const currentIdx = this.currentIndex.get(serviceName) || 0;
    const selectedInstance = healthyInstances[currentIdx % healthyInstances.length];
    
    // Update index for next request
    this.currentIndex.set(serviceName, (currentIdx + 1) % healthyInstances.length);
    
    return selectedInstance.url;
  }

  getServiceHealth(serviceName: ServiceName): { healthy: number; total: number } {
    const instances = this.instances.get(serviceName) || [];
    const healthy = instances.filter(i => i.healthy).length;
    return { healthy, total: instances.length };
  }

  getAllServicesHealth(): Record<string, { healthy: number; total: number }> {
    const health: Record<string, { healthy: number; total: number }> = {};
    
    for (const serviceName of this.instances.keys()) {
      health[serviceName] = this.getServiceHealth(serviceName);
    }
    
    return health;
  }

  stop() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
  }
}

export const loadBalancer = new LoadBalancer();
