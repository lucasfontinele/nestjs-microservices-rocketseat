import { Module } from '@nestjs/common';
import { HealthService } from './health.service.js';
import { HealthCheckService } from '../common/health/health-check.service.js';
import { HealthController } from './health.controller.js';

@Module({
  imports: [HealthCheckService],
  providers: [HealthService],
  controllers: [HealthController],
})
export class HealthModule {}
