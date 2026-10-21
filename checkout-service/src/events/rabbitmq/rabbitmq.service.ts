import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import { mergeScan } from 'rxjs';

@Injectable()
export class RabbitmqService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitmqService.name);
  private connection: amqp.ChannelModel;
  private channel: amqp.Channel;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect() {
    try {
      const rabbitmqUrl = this.configService.get<string>('RABBITMQ_URL', 'amqp://admin:admin@localhost:5672');
      
      this.connection = await amqp.connect(rabbitmqUrl);
      this.channel = await this.connection.createChannel();

      this.logger.log('✅ Connected to RabbitMQ successfully');


      this.channel.on('error', (error) => {
        this.logger.error('🚨 RabbitMQ channel error', error);
      });

      this.channel.on('close', () => {
        this.logger.warn('🚨 RabbitMQ channel closed');
      });

      this.channel.on('return', (msg) => {
        this.logger.warn('🚨 RabbitMQ message returned', msg);
      });
    } catch (error) {
      this.logger.error('🚨 Failed to connect to RabbitMQ', error);

      throw error;
    }
  }

  private async disconnect() {
    try {
      if (this.channel) {
        await this.channel.close();

        this.logger.log('✅ RabbitMQ channel closed');
      }

      if (this.connection) {
        await this.connection.close();
        
        this.logger.log('✅ RabbitMQ connection closed');
      }
    } catch (error) {
      this.logger.error('🚨 Failed to disconnect from RabbitMQ', error);
    }
  }

  public getChannel(): amqp.Channel {
    if (!this.channel) {
      throw new Error('RabbitMQ channel is not initialized');
    }

    return this.channel;
  }

  public getConnection(): amqp.ChannelModel {
    if (!this.connection) {
      throw new Error('RabbitMQ connection is not initialized');
    }

    return this.connection;
  }

  public async publishMessage(exchange: string, routingKey: string, message: any) {
    try {
      if (!this.channel) { 
        this.logger.warn('⚠️ RabbitMQ channel is not initialized. Message not published.');

        return;
      }

      await this.channel.assertExchange(exchange, 'topic', { durable: true });
      const messageBuffer = Buffer.from(JSON.stringify(message));

      const published = this.channel.publish(
        exchange,
        routingKey,
        messageBuffer,
        { persistent: true, timestamp: Date.now(), contentType: 'application/json' }
      );

      if (!published) {
        throw new Error('Failed to publish message to RabbitMQ');
      }

      this.logger.log(`✅ Message published to exchange "${exchange}" with routing key "${routingKey}"`);
    } catch (error) {
      this.logger.error('🚨 Failed to publish message', error);
    }
  }

  public async subscribeToQueue(queueName: string, exchange: string, routingKey: string, onMessage: (msg: unknown | null) => Promise<void>) {
    try {
      if (!this.channel) {
        this.logger.warn('⚠️ RabbitMQ channel is not initialized. Message not subscribed.');

        return;
      }

      await this.channel.assertExchange(exchange, 'topic', { durable: true });

      const queue = await this.channel.assertQueue(queueName, { 
        durable: true,
        arguments: { 
          'x-message-ttl': 86400000,
          'x-max-lenght': 10000
        } 
      });

      await this.channel.bindQueue(queueName, exchange, routingKey);

      await this.channel.prefetch(1);

      this.channel.consume(queue.queue, async (msg) => {
        try {
          if (msg) {
            const message = JSON.parse(msg.content.toString())

            this.logger.log(`📩 Received message from queue "${queueName}" with routing key "${routingKey}": ${JSON.stringify(message)}`);
            this.logger.log(`📩 Message content: ${msg.content.toString()}`);

            await onMessage(msg);

            this.channel.ack(msg);

            this.logger.log(`✅ Message from queue "${queueName}" with routing key "${routingKey}" processed successfully`);
          }
        } catch {
          this.logger.error(`🚨 Failed to process message from queue "${queueName}" with routing key "${routingKey}"`);
          this.channel.nack(msg as unknown as amqp.ConsumeMessage, false, false)
        }
      }, { noAck: false });
    } catch (error) {
      this.logger.error('🚨 Failed to subscribe to queue', error);
    }
  }
}
