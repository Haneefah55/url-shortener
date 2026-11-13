import { Injectable, ConflictException, BadRequestException, HttpStatus, HttpException } from '@nestjs/common';
import bcrypt from 'bcryptjs'
import { User } from '../schemas/user.schema'
import { SignupDto } from '../dto/signup.dto'
import { InjectModel } from '@nestjs/mongoose';
import { randomUUID } from 'crypto'
import { jwtService } from '@nestjs/jwt'
import { TokenService } from './token.service'
import { Model } from 'mongoose';
import { RabbitMQPublisherService} from '../rabbitMQ/rabbitmq-publisher.service'
import { OAuth2Client } from 'google-auth-library';
import dotenv from 'dotenv'



dotenv.config()


@Injectable()
export class GoogleAuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private publisher: RabbitMQPublisherService,
    private readonly jwt: jwtService,
    private tokenService: TokenService,
  ) {}



  private googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI // e.g., 'http://localhost:3000/api/auth/google/callback'
  );

  getGoogleAuthUrl() {
  const scopes = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ];

  return {
    url: this.googleClient.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
    }),
  };
  }

  async handleGoogleAuthCallback(code: string) {
  try {
    
    const { tokens } = await this.googleClient.getToken(code);
    this.googleClient.setCredentials(tokens);

    // Fetch the user's profile info using the Google tokens
    const ticket = await this.googleClient.verifyIdToken({
      idToken: tokens.id_token!,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new HttpException("Invalid Google token payload", HttpStatus.BAD_REQUEST);
    }

    const { email, name, sub: googleId } = payload;

    // Check if user already exists in database
    let user = await this.userModel.findOne({ email });

    if (!user) {
      // Create a new user if they don't exist
      user = await this.userModel.create({
        username: name ? name.replace(/\s+/g, '').toLowerCase() + Math.floor(Math.random() * 1000) : `user_${Math.floor(Math.random() * 10000)}`,
        email,
        emailVerified: true, 
        googleId,
        authProvider: 'google',
        tokenVersion: 0,
      });

      // Publish user.created event
      const eventPayload = {
        username: user.username,
        email: user.email,
        userId: user._id,
      };
      
      this.publisher.publish("user.verified", eventPayload);
    } else if (!user.googleId) {
      // optional if user has previously signup without google
      user.googleId = googleId;
      user.emailVerified = true;
      await user.save();
    }

    // generate  tokens
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
    console.log("Google auth callback error:", error.message);
    throw new HttpException(
      error.message || "Google authentication failed", 
      HttpStatus.BAD_REQUEST
    );
  }
}


  
}