
import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { NotificationModule } from './notification.module';
import { setupExchangeBinding } from '../../../lib/common/rabbitmq/setup-exchange-binding';
import 'dotenv/config'

async function bootstrap() {
	
  const rabbitmqUrl = process.env.RABBITMQ_URL!;
	
  const queueName = 'notification_queue';

  await setupExchangeBinding(rabbitmqUrl, 'url_events_exchange', queueName);

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(NotificationModule, {
    transport: Transport.RMQ,
    options: {
      urls: [rabbitmqUrl],
      queue: queueName,
      queueOptions: { durable: true },
      noAck: false,
      socketOptions: {
        heartbeatIntervalInSeconds: 30,
        reconnectTimeInSeconds: 5,
      },
    },
  });
  await app.listen();
	
  console.log(`Notification service bound to exchange, listening on ${queueName}`);
}
bootstrap();