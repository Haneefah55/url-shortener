// apps/edge/src/lib/rabbitmq.ts
import amqp from 'amqp-connection-manager';

const AMQP_URL = process.env.RABBITMQ_URL!

const MAIN_EXCHANGE = 'main_events_exchange'; // Replace with your main exchange name

// Create a connection manager singleton
const connection = amqp.connect([AMQP_URL]);

// Create a channel wrapper
const channelWrapper = connection.createChannel({
  json: true,
  setup: (channel: any) => {
    // Assert main exchange exists on startup
    return channel.assertExchange(MAIN_EXCHANGE, 'fanout', { durable: true });
  },
});

/**
 * Publishes an event payload directly to the main RabbitMQ exchange.
 */
export async function publisher(pattern: string, data: Record<string, any>): Promise<void> {
  try {
    const payload ={ pattern, data }
				
    await channelWrapper.publish(MAIN_EXCHANGE, '', payload, {
      contentType: 'application/json',
      persistent: true,
      timestamp: Date.now(),
    });


    console.log(`[RabbitMQ] successfully published event "${pattern}" to the main exchange`)
  } catch (error) {
    throw error
    console.error(`[RabbitMQ] Failed to publish event "${pattern}":`, error);
  }
}
