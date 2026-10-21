import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';
import { ProxyService } from './proxy/service/proxy.service.js';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly proxyService: ProxyService
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
