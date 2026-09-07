import { Injectable, Logger } from '@nestjs/common';
import { RetryOptions, RetryResult } from './retry.interface.js';

@Injectable()
export class RetryService {
  private readonly logger = new Logger(RetryService.name);

  private readonly defaultOptions: RetryOptions = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    jitter: true,
  }

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    options?: Partial<RetryOptions>
  ): Promise<RetryResult<T>> {
    const config = { ...this.defaultOptions, ...options };
    const startTime = Date.now();
    let lastError: Error;

    for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
      try {
        this.logger.debug(`Retry attempt ${attempt + 1}/${config.maxRetries + 1}`);

        const data = await operation();
        const totalTime = Date.now() - startTime;

        this.logger.log(`Operation succeeded after ${attempt} attempts and ${totalTime} ms`);

        return { success: true, data, attempts: attempt, totalTime };
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(`Attempt ${attempt} failed: ${lastError.message}`);

        if (attempt < config.maxRetries) {
          const delay = this.calculateDelay(attempt, config);
          this.logger.debug(`Waiting for ${delay} ms before next attempt`);
          await this.delay(delay);
        }
      }
    }
    this.logger.error(`Operation failed after ${config.maxRetries} attempts: ${lastError!.message}`);
    return { success: false, data: undefined, attempts: config.maxRetries, totalTime: Date.now() - startTime };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private calculateDelay(
    attempt: number,
    options: RetryOptions,
  ): number {
    let delay = options.baseDelay * Math.pow(options.backoffMultiplier, attempt);

    if (options.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5); // Randomize delay between 50% and 100% of the calculated delay
    }

    return delay;
  }
}
