
import { Controller, Post, Body, Res, UnauthorizedException, HttpException, HttpStatus, BadRequestException } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from '../dto/login.dto';
import { SignupDto } from '../dto/signup.dto';
import 'dotenv/config'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signUp(
    @Body() dto: SignupDto,
  ){
    return this.authService.signupUser(dto)
    
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const accessToken= 3
    const user = "olamide"
   // const { accessToken, user } = await this.authService.login(dto);

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
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', { path: '/' });
    return { message: 'Logged out successfully' };
  }

  @Post('verify')
  async verifyEmail(
    @Body() code: string,
    @Res({ passthrough: true }) res: Response,
  ) {
try {
  

    if(!code){
      throw new BadRequestException("verification code is required")
    }

    const { accessToken, refreshToken, user} = await this.authService.verifyEmail(code)

    res.cookie('access_token', accessToken, {
      httpOnly: true, // Prevents JavaScript (XSS) access
      secure: process.env.NODE_ENV! === 'production', // Requires HTTPS in production
      sameSite: 'strict', // CSRF mitigation
      maxAge: 1000 * 60 * 15, // 15 mins
      path: '/api',
    });
  
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true, // Prevents JavaScript (XSS) access
      secure: process.env.NODE_ENV! === 'production', // Requires HTTPS in production
      sameSite: 'strict', // CSRF mitigation
      maxAge: 1000 * 60 * 60 * 7, // 7days
      path: '/api/auth/refresh',
    });

  const userData= {
    id: user._id,
    email: user.email,
    isVerified: user.emailVerified,
    image: user.image || '',
    plan: user.plan,
    urlLimit: user.urlLimit,
    lastLogin: user.lastLogin,
    createdAt: user.createdAt
    
    
    
  }

  return ({ message: "user verified successfully", userData})
} catch (error: any) {

  throw new HttpException(error.message, HttpStatus.EXPECTATION_FAILED)
  
}
    
    

    
    
  }
}
