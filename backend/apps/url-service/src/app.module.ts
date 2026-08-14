import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import 'dotenv/config';
import { MongooseModule } from '@nestjs/mongoose'
import { Url, UrlSchema } from './schemas/url.schema';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { RabbitMQPublisherService } from './events/rabbitmq-publisher.service';

import { AuthModule } from './auth/auth.module';
import { AccountModule } from './account/account.module';

@Module({
  imports:[
			MongooseModule.forRoot(process.env.MONGODB_URI!, {
      connectionFactory: (connection) => {
        connection.on('connected', () => {
          console.log('✅ MongoDB connected');
        });

        connection.on('error', (error) => {
          console.error('❌ MongoDB connection error:', error);
        });

        connection.on('disconnected', () => {
          console.log('⚠️ MongoDB disconnected');
        });

        return connection;
      },
    }),
			MongooseModule.forFeature([{ name: Url.name, schema: UrlSchema }]),
			AuthModule,
			AccountModule],
  controllers: [AppController],
  providers: [
    AppService,
    RabbitMQPublisherService,
  ],
})
export class AppModule {}


