import { Injectable } from '@nestjs/common';
import { sendVerificationEmail } from '../lib/email/email'
import { UserCreatedEvent } from '../lib/interfaces/emailevent.interface'
import { RabbitMQPublisherService } from '../events/rabbitmq-publisher.service'
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Email, EmailStatus } from '../schemas/email.schema'

@Injectable()
export class EmailService {
  constructor(
    @InjectModel(Email.name) private emailModel: Model<Email>,
    private publisher: RabbitMQPublisherService
  ){}

  async verifyEmail(data: UserCreatedEvent){
    try {
      const email = data.email
      const token = data.token
      const userId = data.userId


      const newEmailNot = await this.emailModel.create({
        userId,
        email,
        type: "verification email",
        
        
      })
      const result = await sendVerificationEmail(email, token)

      if (result.error){
        console.log("email verification failed", result)
        this.publisher.publish("email.failed", result)
        newEmailNot.status = EmailStatus.Failed
        await newEmailNot.save()
        
        return result
      }

      console.log("verification email sent")
      this.publisher.publish("email.sent", result)
      newEmailNot.status = EmailStatus.Sent
      
      return result

      
    } catch (error) {
      console.log(error)
      
    }
    
  }
}
