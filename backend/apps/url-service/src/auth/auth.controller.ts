
import { Controller, Post, Get, Body, Res, UnauthorizedException, HttpException, HttpStatus, BadRequestException } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from '../dto/login.dto';
import { SignupDto } from '../dto/signup.dto';
import dotenv from 'dotenv/config'
import { OAuth2Client } from 'google-auth-library';
import { CurrentUser } from '../decorators/current-user.decorator'
import { Public } from '../decorators/public.decorator'
import { GoogleAuthService } from './google-auth.service'

dotenv.config()


@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly googleService: GoogleAuthService,
    ){}

  @Public()
  @Post('signup')
  async signUp(
    @Body() dto: SignupDto,
  ){
    return this.authService.signupUser(dto)
    
  }

  @Public()
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    
   const { accessToken, user } = await this.authService.login(dto);

    try {

      res.cookie('accessToken', accessToken, {
      httpOnly: true, // Prevents JavaScript (XSS) access
      secure: process.env.NODE_ENV! === 'production', // Requires HTTPS in production
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
    res.clearCookie('accessToken', { path: '/' });
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

    res.cookie('accessToken', accessToken, {
      httpOnly: true, // Prevents JavaScript (XSS) access
      secure: process.env.NODE_ENV! === 'production', // Requires HTTPS in production
      sameSite: 'strict', // CSRF mitigation
      maxAge: 1000 * 60 * 15, // 15 mins
      path: '/api',
    });
  
    res.cookie('refreshToken', refreshToken, {
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

  @Get('google')
  redirectToGoogle(
    @Res() res: Response) {
    const { url } = this.GoogleAuthService.getGoogleAuthUrl();
    return res.redirect(url);
  }


  @Get('google/callback')
  async handleGoogleCallback(
    @Query('code') code: string, 
    @Res({ passthrough: true }) res: Response) {
  
    const { accessToken, refreshToken, user } = await this.GoogleAuthService.handleGoogleAuthCallback(code);

  // Set cookies 
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000, 
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  // Redirect user back to your frontend dashboard/home page after successful login
  return res.redirect(process.env.FRONTEND_REDIRECT_URL || 'http://localhost:3000/dashboard');
}


  

  
}

