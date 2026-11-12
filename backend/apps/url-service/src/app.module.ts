import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './guards/auth.guard'
import { AppController } from './app.controller';
import { AppService } from './app.service';
import 'dotenv/config';
import { MongooseModule } from '@nestjs/mongoose'
import { Url, UrlSchema } from './schemas/url.schema';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AuthMiddleware } from './middleware/auth.middleware'
import { RabbitMQPublisherService } from './events/rabbitmq-publisher.service';

import { AuthModule } from './auth/auth.module';


@Module({
  imports:[
			MongooseModule.forRoot(process.env.MONGODB_URI!, {
      connectionFactory: (connection) => {
        connection.on('connected', () => {
          console.log('✅ MongoDB connected');
        });

        connection.on('error', (error: any) => {
          console.error('❌ MongoDB connection error:', error);
        });

        connection.on('disconnected', () => {
          console.log('⚠️ MongoDB disconnected');
        });

        return connection;
      },
    }),
			MongooseModule.forFeature([{ name: Url.name, schema: UrlSchema }]),
			AuthModule],
  controllers: [AppController],
  providers: [
    AppService,
    RabbitMQPublisherService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
  
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes({ path: '/api/url/*', method: RequestMethod.ALL });
  }
}