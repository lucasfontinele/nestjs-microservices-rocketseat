import { Controller, Get, Param } from '@nestjs/common';
import { HealthService } from './health.service.js';
import { HealthCheckService } from '../common/health/health-check.service.js';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthStatusEnum } from '../common/health/health-check.interface.js';
import { serviceConfig } from '../config/gateway.config.js';

@Controller('health')
export class HealthController {
  constructor(
    private readonly healthService: HealthService,
    private readonly healthCheckService: HealthCheckService
  ) {}

  @Get()
  @ApiOperation({ summary: 'Check the health of the API Gateway' })
  @ApiResponse({ status: 200, description: 'API Gateway is healthy' })
  async getHealth() {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version ?? '1.0.0',
    }
  }

  @Get('services')
  @ApiOperation({ summary: 'Check the health of all services' })
  @ApiResponse({ status: 200, description: 'All services are healthy' })
  async getServicesHealth() {
    const services = await this.healthCheckService.checkAllServicesHealth();

    const overallStatus = services.every(service => service.status === HealthStatusEnum.HEALTHY) ? 'ok' : 'degraded';

    return {
      overallStatus,
      timestamp: new Date().toISOString(),
      services,
      summary: {
        total: services.length,
        healthy: services.filter(service => service.status === HealthStatusEnum.HEALTHY).length,
        unhealthy: services.filter(service => service.status === HealthStatusEnum.UNHEALTHY).length,
      }
    }
  }

  @Get('services/:serviceName')
  @ApiOperation({ summary: 'Check the health of a specific service' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async getServiceHealth(@Param('serviceName') serviceName: string) {
    const service = serviceConfig[serviceName as keyof typeof serviceConfig];

    if (!service) {
      return { status: 'not found', message: `Service ${serviceName} not found` };
    }

    const cached = this.healthCheckService.getCachedHealthStatus(serviceName as keyof typeof serviceConfig);

    if (!cached) {
      return { status: 'not found', message: `Service ${serviceName} not found or never checked` };
    }

    return cached;
  }
  
  @Get('ready')
  @ApiOperation({ summary: 'Check if the API Gateway is ready' })
  @ApiResponse({ status: 200, description: 'API Gateway is ready' })
  async getReady() {
    const services = await this.healthCheckService.checkAllServicesHealth();

    const allServicesHealthy = services.every(service => service.status === HealthStatusEnum.HEALTHY);

    return {
      status: allServicesHealthy ? 'ready' : 'not ready',
      timestamp: new Date().toISOString(),
      services,
    }
  }

  @Get('live')
  @ApiOperation({ summary: 'Check if the API Gateway is live' })
  @ApiResponse({ status: 200, description: 'API Gateway is live' })
  async getLive() {
    return {
      status: 'live',
      timestamp: new Date().toISOString(),
    }
  }
}
