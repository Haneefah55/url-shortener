// auth/token.service.ts
import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Redis } from 'ioredis';
import { randomUUID, createHash } from 'crypto';
import { REDIS_CLIENT } from '../redis/redis.module';
import { User } from '../schemas/user.schema'
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';



@Injectable()
export class TokenService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly jwt: JwtService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  // Helper to hash refresh tokens before saving in Redis
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async generateTokens(userId: string, email: string, tokenVersion: number) {
    const tokenId = randomUUID(); // Unique JWT ID (jti)

    const [accessToken, refreshToken] = await Promise.all([
      
      this.jwt.signAsync(
        {
          sub: userId,
          version:tokenVersion,
        },
        {
          secret: process.env.JWT_ACCESS_SECRET!,
          expiresIn: '15m',
        },
      ),

      
      this.jwt.signAsync(
        {
          sub: userId,
          jti: tokenId,
          version: tokenVersion
          
        },
        {
          secret: process.env.JWT_REFRESH_SECRET!,
          expiresIn: '7d',
        },
      ),
    ]);
    
    const hashedToken = this.hashToken(refreshToken);

    
    const redisKey = `user:${userId}:token:${tokenId}`;
    
    await this.redis.set(redisKey, hashedToken, 'EX', 604800);

    return { accessToken, refreshToken };
  }
  

  async rotateRefreshToken(oldRefreshToken: string) {
    let payload: { sub: string; jti: string };

    try {
      payload = await this.jwt.verifyAsync(oldRefreshToken, {
        secret: process.env.JWT_REFRESH_SECRET!,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const { sub: userId, jti: tokenId } = payload;

    
    
    const redisKey = `user:${userId}:token:${tokenId}`;
    
    const storedHash = await this.redis.get(redisKey);

    
    if (!storedHash || storedHash !== this.hashToken(oldRefreshToken)) {
    
      await this.revokeAllUserTokens(userId);
      throw new UnauthorizedException(
        'Security alert: Token reuse detected. All sessions revoked.',
      );
    }

    await this.redis.del(redisKey);


    const user = await this.userModel.findById(userId)

    if(!user) {
      throw new UnauthorizedException('Invalid user id');
    }
//increment tokenVersion
        await this.userModel.findByIdAndUpdate(user._id, {
      $inc: { tokenVersion: 1 }
    })



    
    return this.generateTokens(String(user._id), user.email, user.tokenVersion);
  }

  async revokeToken(refreshToken: string) {
    try {
      const payload = await this.jwt.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
      
      await this.redis.del(`user:${payload.sub}:token:${payload.jti}`);
    } catch(error) {
      console.log("error in revokeToken", error)
    }
  }

  async revokeAllUserTokens(userId: string) {

    try {
      const user = await this.userModel.findById(userId)

      if(!user) {
        throw new UnauthorizedException('Invalid user id');
      }
//increment tokenVersion
        await this.userModel.findByIdAndUpdate(user._id, {
      $inc: { tokenVersion: 1 }
    })

      const keys = await this.redis.keys(`user:${userId}:token:*`);
      if (keys.length > 0) {
      await this.redis.del(...keys);
    }
    } catch (error) {
      console.log("error in revoke all user")
    }

    
  }
}
