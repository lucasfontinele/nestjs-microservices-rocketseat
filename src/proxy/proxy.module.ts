import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { CircuitBreakerModule } from '../common/circuit-breaker/circuit-breaker.module.js';
import { ProxyService } from './service/proxy.service.js';
import { FallbackModule } from '../common/fallback/fallback.module.js';

@Module({
  imports: [HttpModule, CircuitBreakerModule, FallbackModule],
  providers: [ProxyService],
  exports: [ProxyService],
})
export class ProxyModule {}
