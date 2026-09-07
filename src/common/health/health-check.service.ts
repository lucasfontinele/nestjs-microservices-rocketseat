import { Injectable, Logger } from "@nestjs/common";
import { HealthStatusEnum, ServiceHealth } from "./health-check.interface.js";
import { HttpService } from "@nestjs/axios";
import { CircuitBreakerService } from "../circuit-breaker/circuit-breaker.service.js";
import { serviceConfig } from "../../config/gateway.config.js";
import { firstValueFrom, timeout } from "rxjs";

@Injectable()
export class HealthCheckService {
  private readonly logger = new Logger(HealthCheckService.name);
  private readonly healthCache = new Map<string,ServiceHealth>();
  
  constructor(
    private readonly httpService: HttpService,
    private readonly circuitBreakerService: CircuitBreakerService,
  ) {}

  async checkServiceHealth(serviceName: keyof typeof serviceConfig): Promise<ServiceHealth> {
    const service = serviceConfig[serviceName];
    const startTime = Date.now();

    try {
      await this.circuitBreakerService.executeWithCircuitBreaker(
        async () => {
          const response = await firstValueFrom(
            this.httpService.get(`${service.url}/health`, { timeout: service.timeout }).pipe(timeout(service.timeout))
          )
        },
        serviceName,
        async () => {
          throw new Error(`Service ${serviceName} is unavailable`);
        }
      )

      const responseTime = Date.now() - startTime;
      const serviceHealth: ServiceHealth = {
        name: serviceName,
        url: service.url,
        status: HealthStatusEnum.HEALTHY,
        responseTime,
        lastChecked: new Date(),
      };

      this.healthCache.set(serviceName, serviceHealth);

      return serviceHealth;
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      const serviceHealth: ServiceHealth = {
        name: serviceName,
        url: service.url,
        status: HealthStatusEnum.UNHEALTHY,
        responseTime,
        lastChecked: new Date(),
        error: error?.message ?? '',
      };

      this.healthCache.set(serviceName, serviceHealth);
      this.logger.error(`Health check failed for service ${serviceName}: ${error.message}`);

      return serviceHealth;
    }
  }

  async checkAllServicesHealth(): Promise<ServiceHealth[]> {
    const services = Object.keys(serviceConfig).map((serviceName) =>
      this.checkServiceHealth(serviceName as keyof typeof serviceConfig)
    );

    const healthChecks = await Promise.allSettled(services);

    return healthChecks.map((result, index) => {
      if (result.status === "fulfilled") {
        return result.value;
      }

      return this.healthCache.get(Object.keys(serviceConfig)[index]) || {
        name: Object.keys(serviceConfig)[index],
        url: serviceConfig[Object.keys(serviceConfig)[index] as keyof typeof serviceConfig].url,
        status: HealthStatusEnum.UNHEALTHY,
        responseTime: 0,
        lastChecked: new Date(),
        error: result.reason?.message ?? '',
      };
    })
  }

  getCachedHealthStatus(serviceName: keyof typeof serviceConfig): ServiceHealth | undefined {
    return this.healthCache.get(serviceName);
  }

  getAllCachedHealth(): ServiceHealth[] {
    return Array.from(this.healthCache.values());
  }
}