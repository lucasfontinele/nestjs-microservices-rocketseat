import { Module } from '@nestjs/common';
import { ProxyService } from './service/proxy.service.js';

@Module({
  providers: [ProxyService],
  exports: [ProxyService],
})
export class ProxyModule {}
