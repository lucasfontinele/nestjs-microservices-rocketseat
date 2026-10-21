import { Injectable } from '@nestjs/common';
import { HealthStatusEnum } from '../common/health/health-check.interface.js';
import { HealthCheckService } from '../common/health/health-check.service.js';

@Injectable()
export class HealthService {
  constructor(
    private readonly healthCheckService: HealthCheckService,
  ) {}

  async getHealthStatus() {
    const healthChecks = await this.healthCheckService.checkAllServicesHealth();
    const results = {
      status: HealthStatusEnum.HEALTHY,
      timestamp: new Date().toISOString(),
      gateway: {
        status: HealthStatusEnum.HEALTHY,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
      },
      services: {} as Record<string, unknown>
    };

    let hasUnhealthServices = false;

    healthChecks.forEach(health => {
      results.services[health.name] = {
        status: health.status,
        responseTime: health.responseTime,
        lastChecked: health.lastChecked,
        url: health.url,
        ...(health.error && { error: health.error })
      }

      if (health.status === HealthStatusEnum.UNHEALTHY) {
        hasUnhealthServices = true;
      }
    })

    if (hasUnhealthServices) {
      results.status = HealthStatusEnum.DEGRADED;
    }

    return results;
  }

  async getReadyStatus() {
    const healthStatus = await this.getHealthStatus();

    return {
      status: healthStatus.status === HealthStatusEnum.HEALTHY ? "ready" : "not_ready",
      timestamp: new Date().toISOString(),
      services: healthStatus.services,
    };
  }

  /**
   * Calculates the live status of the API Gateway. This endpoint is used for liveness probes.
   * @returns A promise resolving to the live status.
   **/
  async getLiveStatus() {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    }
  }
}
