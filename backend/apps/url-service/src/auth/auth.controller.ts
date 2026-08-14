
import { Controller, Post, Body, Res, UnauthorizedException, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from '../dto/login.dto';
import 'dotenv/config'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    
    const { accessToken, user } = await this.authService.login(dto);

    try {

      res.cookie('access_token', accessToken, {
      httpOnly: true, // Prevents JavaScript (XSS) access
      secure: process.env.NODE_ENV === 'production', // Requires HTTPS in production
      sameSite: 'strict', // CSRF mitigation
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      path: '/',
    });

    return { success: true, message: 'Login successful', user };
    
    
    } catch (error: any) {
      throw new HttpException(error.message, 400)
    }
    

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', { path: '/' });
    return { message: 'Logged out successfully' };
  }
}
