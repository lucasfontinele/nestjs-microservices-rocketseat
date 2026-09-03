import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerException, ThrottlerGuard, ThrottlerRequest } from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    return `${req.ip}-${req.headers['user-agent']}`;
  }

  protected async handleRequest(requestProps: ThrottlerRequest): Promise<boolean> {
    const { context, limit, ttl } = requestProps;
    const { req, res } = this.getRequestResponse(context);
    const throttles = this.reflector.get('throttle', context.getHandler());
    const throttleName = throttles ? Object.keys(throttles)[0] : 'default';
    const tracker = await this.getTracker(req);
    const key = this.generateKey(context, tracker, throttleName);

    const totalHits = await this.storageService.increment(key, ttl, limit, 1, throttleName)

    if (Number(totalHits) > limit) {
      res.setHeader('Retry-After', ttl);
      throw new ThrottlerException(`Too many requests. Please try again later.`);
    }

    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', limit - Number(totalHits));
    res.setHeader('X-RateLimit-Reset', Math.floor(Date.now() / 1000) + ttl);

    return true;    
  }
}
