import { Module } from '@nestjs/common';
import { TimeoutService } from './timeout.service.js';

@Module({
  providers: [TimeoutService]
})
export class TimeoutModule {}
