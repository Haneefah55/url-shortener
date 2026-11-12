import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Reflector } from '@nestjs/core';
import { User, UserDocument } from '../schemas/user.schema';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly reflector: Reflector, // Added reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Check if the route is marked as @Public()
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true; // Bypass authentication
    }

    const request = context.switchToHttp().getRequest();
    const token = request.cookies?.accessToken;

    if (!token) {
      throw new UnauthorizedException('Unauthorized User');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_ACCESS_SECRET!,
      });

      const user = await this.userModel.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User does not exists');
      }

      if (payload.version !== user.tokenVersion) {
        throw new UnauthorizedException('Unauthorized user. Please log in.');
      }

      request.user = {
        userId: payload.sub,
        version: payload.version,
        email: user.email,
        username: user.username,
      };

      return true;
    } catch (error: any) {
      throw new UnauthorizedException(
        error.message === 'jwt expired' 
          ? 'Access token expired' 
          : 'Invalid access token'
      );
    }
  }
}
