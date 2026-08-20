// redis/redis.module.ts
import { Module, Global, Logger } from '@nestjs/common';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: () => {
        const logger = new Logger('RedisModule');
        const redisUrl = process.env.REDIS_URL;

        if (!redisUrl) {
          throw new Error('REDIS_URL is missing from environment variables');
        }

        const client = new Redis(redisUrl, {
          // Keep-alive packet every 10s prevents GCE firewall from closing idle TCP sockets
          keepAlive: 10000,
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
          retryStrategy(times) {
            const delay = Math.min(times * 100, 3000);
            logger.warn(`Redis connection lost. Retrying in ${delay}ms... (Attempt ${times})`);
            return delay;
          },
        });

        client.on('connect', () => logger.log('Connected to Upstash Redis over TLS'));
        client.on('error', (err) => logger.error('Redis client error:', err.stack));

        return client;
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
