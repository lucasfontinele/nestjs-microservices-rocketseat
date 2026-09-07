import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class DefaultFallbackService {
  private readonly logger = new Logger(DefaultFallbackService.name);

  createDefaultFallback<T>(defaultData: T, serviceName: string): () => Promise<T> {
    return async (): Promise<T> => {
      this.logger.warn(`Returning default fallback response for ${serviceName}`);
      return defaultData;
    };
  }

  createErrorFallback(serviceName: string, errorMessage: string): () => Promise<never> {
    return async (): Promise<never> => {
      this.logger.error(`Error in ${serviceName}: ${errorMessage}`);
      throw new Error(errorMessage);
    };
  }

  createEmptyArrayFallback<T>(serviceName: string): () => Promise<T[]> {
    return async (): Promise<T[]> => {
      this.logger.warn(`Returning empty array fallback response for ${serviceName}`);
      return [];
    };
  }

  createEmptyObjectFallback<T>(serviceName: string): () => Promise<T> {
    return async (): Promise<T> => {
      this.logger.warn(`Returning empty object fallback response for ${serviceName}`);
      return {} as T;
    };
  }
}