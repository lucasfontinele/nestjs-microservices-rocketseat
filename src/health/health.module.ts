import { Module } from '@nestjs/common';
import { HealthCheckModule } from '../common/health/health-check.module.js';
import { HealthController } from './health.controller.js';
import { HealthService } from './health.service.js';

@Module({
  imports: [HealthCheckModule],
  providers: [HealthService],
  controllers: [HealthController],
})
export class HealthModule {}
