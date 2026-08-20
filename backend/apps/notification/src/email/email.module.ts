import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';
import { MongooseModule } from '@nestjs/mongoose'
import { RabbitMQPublisherService} from '../events/rabbitmq-publisher.service'
import { Email, EmailSchema } from '../schemas/email.schema'

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Email.name, schema: EmailSchema }]),
  ],
  controllers: [EmailController],
  providers: [EmailService, RabbitMQPublisherService ],
})
export class EmailModule {}
