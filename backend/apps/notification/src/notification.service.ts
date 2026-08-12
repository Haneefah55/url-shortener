import { Injectable } from '@nestjs/common';

@Injectable()
export class NotificationService {
	
  getHello() {
    console.log("hello from notification")
  }
}

