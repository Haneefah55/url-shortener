import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { HttpException, HttpStatus } from '@nestjs/common';
import * as amqp from 'amqplib';
import type { ChannelModel, Channel } from 'amqplib';
import 'dotenv/config';

@Injectable()
export class RabbitMQPublisherService implements OnModuleInit, OnModuleDestroy {
  private connection!: ChannelModel;
  private channel!: Channel;
  private readonly exchangeName = 'url_events_exchange';

  async onModuleInit() {
    this.connection = await amqp.connect(process.env.RABBITMQ_URL!);
    this.channel = await this.connection.createChannel();
    await this.channel.assertExchange(this.exchangeName, 'fanout', { durable: true });
  }

  publish(pattern: string, data: any) {

			try {
				const payload = Buffer.from(JSON.stringify({ pattern, data }));
				
					this.channel.publish(this.exchangeName, '', payload, { persistent: true });
				console.log(`${pattern} is published to the ${this.exchangeName} successfully`)
			} catch (error: any) {
				console.log("error publishing to the url_events_exchange", error)

				throw new HttpException("Error publishing to the url_events_exchange", HttpStatus.INTERNAL_SERVER_ERROR)
			}
    
			
  }

  async onModuleDestroy() {
    await this.channel.close();
    await this.connection.close();
  }
}