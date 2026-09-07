import { Module } from "@nestjs/common";
import { HealthCheckService } from "./health-check.service.js";

@Module({
  providers: [HealthCheckService],
  exports: [HealthCheckService],
})
export class HealthCheckModule {}