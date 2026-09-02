import { Injectable, Logger, NestMiddleware } from '@nestjs/common';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');
  
  use(req: any, res: any, next: () => void) {
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('User-Agent') || '';
    const startTime = Date.now();

    this.logger.log(`Incoming Request: ${method} ${originalUrl} - IP: ${ip} - User-Agent: ${userAgent}`);

    res.on('finish', () => {
      const { statusCode } = res;
      const contentLength = res.get('Content-Length') || 0;
      const duration = Date.now() - startTime;

      this.logger.log(`Outgoing Response: ${method} ${originalUrl} - Status: ${statusCode} - Content-Length: ${contentLength} - Duration: ${duration}ms`);

      if (statusCode >= 400) {
        this.logger.error(`Error Response: ${method} ${originalUrl} - Status: ${statusCode} - Duration: ${duration}ms`);
      }
    });

    res.on('error', (err: Error) => {
      this.logger.error(`Response Error: ${method} ${originalUrl} - Error: ${err.message}`);
    });

    res.on('timeout', (err: Error) => {
      this.logger.warn(`Response Timeout: ${method} ${originalUrl} - Error: ${err.message}`);
    });

    next();
  }
}
