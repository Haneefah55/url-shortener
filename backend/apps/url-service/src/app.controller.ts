import { Controller, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';
import { CreateUrlDto } from './dto/create-url.dto'

@Controller("url")
export class AppController {
  constructor(private readonly appService: AppService) {}

	@Post("create")
  create(@Body() dto: CreateUrlDto) {
    return this.appService.create(dto)
  }
}
