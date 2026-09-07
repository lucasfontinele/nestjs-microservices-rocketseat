import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { serviceConfig } from '../../config/gateway.config.js';
import { firstValueFrom } from 'rxjs';
import { CircuitBreakerService } from '../../common/circuit-breaker/circuit-breaker.service.js';

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
    private readonly circuitBreakerService: CircuitBreakerService
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

        this.logger.log(`Successfully proxied request to ${url}`);

        return response.data;
      },
      `${serviceName}:${method}:${path}`,
      { failureThreshold: 3, timeout: 30000, resetTimeout: 30000 },
      () => {
        this.logger.error(`Fallback: Service ${serviceName} is currently unavailable. Returning fallback response.`);
        throw new Error(`Service ${serviceName} is currently unavailable. Please try again later.`);
      }
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
}
