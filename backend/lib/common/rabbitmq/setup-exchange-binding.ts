
import * as amqp from 'amqplib';

export async function setupExchangeBinding(
  rabbitmqUrl: string,
  exchangeName: string,
  queueName: string,
) {
  const conn = await amqp.connect(rabbitmqUrl);
	
  const channel = await conn.createChannel();

  await channel.assertExchange(exchangeName, 'fanout', { durable: true });
	
  await channel.assertQueue(queueName, { durable: true });
	
  await channel.bindQueue(queueName, exchangeName, '');

  await channel.close();
	
  await conn.close();
}