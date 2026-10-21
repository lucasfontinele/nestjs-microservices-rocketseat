import { Injectable, Logger } from '@nestjs/common';
import { RabbitmqService } from '../rabbitmq/rabbitmq.service.js';
import { PaymentOrderMessage } from '../payment-queue.interface.js';

@Injectable()
export class PaymentQueueService {
  private readonly logger = new Logger(PaymentQueueService.name);

  private readonly ROUTING_KEY = 'payment.order';
  private readonly EXCHANGE = 'payments';

  constructor(private readonly rabbitMQService: RabbitmqService) {}

  async publishPaymentOrder(paymentOrder: PaymentOrderMessage) {
    this.logger.log(`📩 Publishing payment order: ${paymentOrder.orderId}`);

    try {
      const enrichmentMessage: PaymentOrderMessage = {
        ...paymentOrder,
        createdAt: new Date(),
        metadata: {
          service: 'checkout-service',
          timestamp: new Date().toISOString(),
        }
      }

      await this.rabbitMQService.publishMessage(this.EXCHANGE, this.ROUTING_KEY, enrichmentMessage);

      this.logger.log(`✅ Payment order published successfully: ${paymentOrder.orderId}`);
      this.logger.debug(`📦 Payment order details: ${JSON.stringify(enrichmentMessage)}`);
    } catch (error) {
      this.logger.error(`🚨 Failed to publish payment order: ${paymentOrder.orderId}`);
      throw error;
    }
  }

  private validatePaymentOrder(paymentOrder: PaymentOrderMessage) {
    if (!paymentOrder.orderId || !paymentOrder.userId || !paymentOrder.amount || !paymentOrder.items || !paymentOrder.paymentMethod) {
      throw new Error('Invalid payment order message');
    }

    if (!Array.isArray(paymentOrder.items) || paymentOrder.items.length === 0) {
      throw new Error('Payment order must contain at least one item');
    }

    for (const item of paymentOrder.items) {
      if (!item.productId || !item.quantity || !item.price) {
        throw new Error('Each item in the payment order must have productId, quantity, and price');
      }
    }
  }

  async publishPaymentOrderSafely(paymentOrder: PaymentOrderMessage) {
    try {
      this.validatePaymentOrder(paymentOrder);

      await this.publishPaymentOrder(paymentOrder);
    } catch (error) {
      this.logger.error(`🚨 Failed to publish payment order safely: ${paymentOrder.orderId}`, error);
      throw error;
    }
  }
}
