import { Injectable, NestMiddleware } from '@nestjs/common';
import { Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly jwtService: JwtService) {}

  async use(req: any, res: Response, next: NextFunction) {
    // Extract token from cookies
    const token = req.cookies?.accessToken;

    if (!token) {
      return next(); 
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_ACCESS_SECRET!,
      });

      req.user = {
        userId: payload.sub,
        version: payload.version,
      };
    } catch (error) {
      // Invalid or expired token; let the Guard handle blocking if necessary
    }

    next();
  }
}
