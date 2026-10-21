import { Module } from '@nestjs/common';
import { RabbitmqService } from './rabbitmq/rabbitmq.service.js';
import { ConfigModule } from '@nestjs/config';
import { PaymentQueueService } from './payment-queue/payment-queue.service.js';

@Module({
  providers: [RabbitmqService, PaymentQueueService],
  imports: [ConfigModule],
  exports: [RabbitmqService]
})
export class EventsModule {}
