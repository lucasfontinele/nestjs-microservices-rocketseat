import { Module } from '@nestjs/common';
import { RetryService } from './retry.service.js';

@Module({
  providers: [RetryService]
})
export class RetryModule {}
