import { Controller } from '@nestjs/common';
import { EmailService } from './email.service';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices'
import type { UserCreatedEvent } from '../lib/interfaces/emailevent.interface'


@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}
  
  @EventPattern('user.created')
  async handleVerificationEmail(@Payload() data: UserCreatedEvent, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const message = context.getMessage();
    try {
      console.log("data", data)
      console.log("message recieved successfully")
      const result = await this.emailService.verifyEmail(data)
      if (result?.error){
        console.log('Failed to send verification email', result.error)
        channel.nack(message, false, true)
      }
      
      channel.ack(message);
      console.log(' verification email sent')
    } catch (err) {
      console.log('Failed to send verification email', err);
      channel.nack(message, false, true); // requeue
    }
  }

  
}
