import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class CacheFallbackService {
  private readonly logger = new Logger(CacheFallbackService.name);
  private readonly cache = new Map<string, { data: any; timestamp: number }>();

  async getCachedResponse<T>(
    key: string,
    timeout: number = 300000,
  ): Promise<T | undefined> {
    const cached = this.cache.get(key);
    this.logger.debug(`Retrieving cached response for key: ${key}`);

    if (!cached) {
      this.logger.debug(`No cached response found for key: ${key}`);
      return;
    }

    const isExpired = Date.now() - cached.timestamp > timeout;

    if (isExpired) {
      this.cache.delete(key);
      this.logger.debug(`Cached response for key: ${key} is expired`);

      return;
    }

    return cached.data;
  }

  setCachedData<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  createCacheFallback<T>(
    key: string,
    defaultData: T,
    timeout: number = 300000,
  ) {
    return async (): Promise<T> => {
      const cached = await this.getCachedResponse<T>(key, timeout);

      if (cached) {
        this.logger.log(`Using cached data for ${key}`);

        return cached;
      }

      return defaultData;
    }
  }
}