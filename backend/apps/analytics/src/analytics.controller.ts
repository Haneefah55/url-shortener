import { Controller, Get } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices'


@Controller()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @EventPattern('url.created')
  async handleCreated(@Payload() data: any, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const message = context.getMessage();
    try {
      console.log("data", data)
      console.log("message recieved successfully")
      channel.ack(message);
    } catch (err) {
      console.log('Failed to init stats', err);
      channel.nack(message, false, true); // requeue
    }
  }


  @EventPattern('email.sent')
  async handleEmailSent(@Payload() data: any, @Ctx() context: RmqContext) {
    console.log('Email sent event received:', data);
    const channel = context.getChannelRef();
    const message = context.getMessage();
      try {

    channel.ack(message);
    } catch (err) {
      console.log('Failed to init stats', err);
      channel.nack(message, false, true); // requeue
    }
}


}
