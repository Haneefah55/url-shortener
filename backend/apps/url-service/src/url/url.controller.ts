import { Controller, Get, Post, Patch, Body, Param, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { UrlService } from './url.service';
import { CreateUrlDto } from '../dto/create-url.dto';
import { UpdateUrlDto } from '../dto/update-url.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Adjust path
import { Public } from '../auth/decorators/public.decorator'; // Adjust path
import { CurrentUser } from '../auth/decorators/current-user.decorator'; // Adjust path



@Controller('urls')
export class UrlController {
  constructor(private readonly urlService: UrlService) {}


  //@UseGuards(JwtAuthGuard)
  @Post()
  async createUrl(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateUrlDto,
  ) {
    return this.urlService.createUrl(userId, dto);
  }

  
  //@UseGuards(JwtAuthGuard)
  @Get()
  async getUserUrls(@CurrentUser('userId') userId: string) {
    return this.urlService.getUserUrls(userId);
  }

  
  @Patch(':id')
  async updateUrl(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateUrlDto,
  ) {
    return this.urlService.updateUrl(userId, id, dto);
  }

  
  @Public()
  @Get(':shortCode')
  async redirectToOriginalUrl(
    @Param('shortCode') shortCode: string,
    @Res() res: Response,
  ) {
    const originalUrl = await this.urlService.getOriginalUrl(shortCode);
    return res.redirect(originalUrl);
  }
}
