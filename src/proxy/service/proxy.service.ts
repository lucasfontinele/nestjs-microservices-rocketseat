import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { serviceConfig } from '../../config/gateway.config.js';
import { firstValueFrom } from 'rxjs';
import { CircuitBreakerService } from '../../common/circuit-breaker/circuit-breaker.service.js';
import { CacheFallbackService } from '../../common/fallback/cache.fallback.js';
import { DefaultFallbackService } from '../../common/fallback/default.fallback.js';

interface UserInfo {
  userId: string;
  email: string;
  role: string;
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly circuitBreakerService: CircuitBreakerService,
    private readonly cacheFallbackService: CacheFallbackService,
    private readonly defaultFallbackService: DefaultFallbackService
  ) {}

  async proxyRequest(
    serviceName: keyof typeof serviceConfig,
    method: HttpMethod,
    path: string,
    data?: any,
    headers?: Record<string, string>,
    userInfo?: UserInfo
  ) {
    const service = serviceConfig[serviceName];
    const url = `${service.url}${path}`;

    this.logger.log(`Proxying request to ${url} with method ${method}`);

    const fallback = this.createServiceFallback(serviceName, method, path);

    return this.circuitBreakerService.executeWithCircuitBreaker(
      async () => {
        const enhancedHeaders = {
          ...headers,
          'x-user-id': userInfo?.userId,
          'x-user-role': userInfo?.role,
          'x-user-email': userInfo?.email,
        };

        const response = await firstValueFrom(
          this.httpService.request({
            method: method.toLowerCase() as any,
            url,
            data,
            headers: enhancedHeaders,
            timeout: service.timeout,
          })
        );

        if (method.toUpperCase() === "GET") {
          this.cacheFallbackService.setCachedData(`${serviceName}:${method}:${path}`, response.data);
        }

        this.logger.log(`Successfully proxied request to ${url}`);

        return response.data;
      },
      `${serviceName}:${method}:${path}`,
      { failureThreshold: 3, timeout: 30000, resetTimeout: 30000 },
      fallback,
    );
  }

  async getServiceHealth(serviceName: keyof typeof serviceConfig) {
    try {
      const service = serviceConfig[serviceName];
      const url = `${service.url}/health`;
      
      const response = await firstValueFrom(
        this.httpService.get(url, { timeout: service.timeout })
      );

      return { status: 'healthy', data: response.data };
    } catch (error: Error | any) {
      return { status: 'unhealthy', error: error?.message };
    }
  }

  private createServiceFallback(serviceName: keyof typeof serviceConfig, method: HttpMethod, path: string) {
    switch (serviceName) {
      case "users":
        if (path.includes('/auth/login')) {
          return this.defaultFallbackService.createErrorFallback(
            'users',
            'Authentication service unavailable',
          );
        }

        return this.defaultFallbackService.createErrorFallback(
          'users',
          'User service unavailable',
        );
      case "products":
        if (method.toUpperCase() === "GET") {
          return this.cacheFallbackService.createCacheFallback(
            `products:${path}`,
            { products: [], total: 0, page: 1, limit: 10 }
          );
        }
      case "payments":
      case "checkout":
        return this.defaultFallbackService.createErrorFallback(
          serviceName,
          'Service unavailable',
        );
      default:
        return this.defaultFallbackService.createErrorFallback(
          serviceName,
          'Service unavailable',
        )
    }
  }
}
