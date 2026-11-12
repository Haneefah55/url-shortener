
import { Controller, Post, Body, Res, UnauthorizedException, HttpException, HttpStatus, BadRequestException } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from '../dto/login.dto';
import { SignupDto } from '../dto/signup.dto';
import 'dotenv/config'
import { OAuth2Client } from 'google-auth-library';
import { CurrentUser } from '../decorators/current-user.decorator'
import { Public } from '../decorators/public.decorator'

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
    )
  , {}

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

      res.cookie('access_token', accessToken, {
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



// Inside your Service constructor or module scope:
;

async googleAuth(credential: string) {
  try {
    
    const ticket = await this.googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new HttpException("Invalid Google token", HttpStatus.BAD_REQUEST);
    }

    const { email, name, sub: googleId } = payload;

    // 2. Check if user already exists
    let user = await this.userModel.findOne({ email });

    if (!user) {
      // 3. Create a new user if they don't exist
      user = await this.userModel.create({
        username: name.replace(/\s+/g, '').toLowerCase() + Math.floor(Math.random() * 1000), // Generate a default username
        email,
        emailVerified: true, // Google pre-verifies emails
        googleId,
        authProvider: 'google',
        tokenVersion: 0,
      });

      // Publish user.created event matching your signup flow pattern
      const eventPayload = {
        username: user.username,
        email: user.email,
        userId: user._id,
      };
      this.publisher.publish("user.created", eventPayload);
    } else if (!user.googleId) {
      // Optional: Link Google ID if user previously signed up via email/password
      user.googleId = googleId;
      user.emailVerified = true;
      await user.save();
    }

    // 4. Generate your app's tokens
    const { accessToken, refreshToken } = await this.tokenService.generateTokens(
      String(user._id),
      user.email,
      user.tokenVersion
    );

    return {
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    };
  } catch (error: any) {
    console.log("Google auth error:", error.message);
    throw new HttpException(
      error.message || "Google authentication failed", 
      HttpStatus.BAD_REQUEST
    );
  }
}
