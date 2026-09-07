export enum HealthStatusEnum {
  HEALTHY = 'healthy',
  UNHEALTHY = 'unhealthy',
  DEGRADED = 'degraded'
}

export interface ServiceHealth {
  name: string;
  url: string;
  status: HealthStatusEnum;
  responseTime: number;
  lastChecked: Date;
  error?: Error;
}