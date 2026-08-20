import { Module } from '@nestjs/common';
import {MongooseModule } from '@nestjs/mongoose'
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { EmailModule } from './email/email.module'


@Module({
  imports: [
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
    EmailModule],
  controllers: [NotificationController],
  providers: [NotificationService],
})
export class NotificationModule {}
