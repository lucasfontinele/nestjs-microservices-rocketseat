import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { CircuitBreakerModule } from '../common/circuit-breaker/circuit-breaker.module.js';
import { ProxyService } from './service/proxy.service.js';
import { FallbackModule } from '../common/fallback/fallback.module.js';
import { TimeoutModule } from '../common/timeout/timeout.module.js';
import { RetryModule } from '../common/retry/retry.module.js';

@Module({
  imports: [HttpModule, CircuitBreakerModule, FallbackModule, TimeoutModule, RetryModule],
  providers: [ProxyService],
  exports: [ProxyService],
})
export class ProxyModule {}
