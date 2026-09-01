import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { serviceConfig } from '../../config/gateway.config.js';
import { errorContext } from 'rxjs/internal/util/errorContext';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);

  constructor(private readonly httpService: HttpService) {}

  async proxyRequest(
    serviceName: keyof typeof serviceConfig,
    method: string,
    path: string,
    data?: any,
    headers?: Record<string, string>,
    userInfo?: any
  ) {
    const service = serviceConfig[serviceName];
    const url = `${service.url}${path}`;

    this.logger.log(`Proxying request to ${url} with method ${method}`);

    try {
      const enhancedHeaders = {
        ...headers,
        'x-user-id': userInfo?.id,
        'x-user-role': userInfo?.role,
        'x-user-email': userInfo?.email,
      }

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
    } catch {
      this.logger.error(`Error proxying request to ${url}`);

      throw errorContext;
    }
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
