import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createObserveModule } from '@nestjs/observe';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { LoggingMiddleware } from './middleware/logging/logging.middleware.js';
import { MiddlewareModule } from './middleware/middleware.module.js';
import { ProxyModule } from './proxy/proxy.module.js';
import { CustomThrottlerGuard } from './guards/throttler.guard.js';
import { HealthModule } from './health/health.module.js';
import { HealthCheckModule } from './common/health/health-check.module.js';
import { FallbackModule } from './common/fallback/fallback.module.js';
import { CircuitBreakerModule } from './common/circuit-breaker/circuit-breaker.module.js';
import { TimeoutModule } from './common/timeout/timeout.module.js';
import { RetryModule } from './common/retry/retry.module.js';

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => [
        {
          name: 'short',
          ttl: 1000,
          limit: configService.get<number>('RATE_LIMIT_SHORT', 10),
        },
        {
          name: 'medium',
          ttl: 60000,
          limit: configService.get<number>('RATE_LIMIT_MEDIUM', 100),
        },
        {
          name: 'long',
          ttl: 900000,
          limit: configService.get<number>('RATE_LIMIT_LONG', 1000),
        },
      ],
      inject: [ConfigService],
    }),
    ProxyModule,
    MiddlewareModule,
    AuthModule,
    HealthModule,
    HealthCheckModule,
    FallbackModule,
    CircuitBreakerModule,
    TimeoutModule,
    RetryModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: 'APP_GUARD',
      useClass: CustomThrottlerGuard,
    }
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}
