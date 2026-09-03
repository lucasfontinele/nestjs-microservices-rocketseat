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

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    // Distributed tracing, auto-correlated logs, request/job metrics, error
    // telemetry, alarms, and more — out of the box. Sign up at https://observe.nestjs.com
    ObserveModule.forRoot({
      appKey: 'YOUR_APP_KEY',
      appSecret: 'YOUR_APP_SECRET',
      serviceId: 'api-gateway',
    }),
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
