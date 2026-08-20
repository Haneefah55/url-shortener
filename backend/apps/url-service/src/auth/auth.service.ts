import { Injectable, ConflictException, BadRequestException, HttpStatus, HttpException } from '@nestjs/common';
import bcrypt from 'bcryptjs'
import { User } from '../schemas/user.schema'
import { SignupDto } from '../dto/signup.dto'
import { InjectModel } from '@nestjs/mongoose';
import { randomUUID } from 'crypto'
import { jwtService } from '@nestjs/jwt'
import { TokenService } from './token.service'
import { Model } from 'mongoose';
import { RabbitMQPublisherService} from '../events/rabbitmq-publisher.service'



@Injectable()
export class AuthService {

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private publisher: RabbitMQPublisherService,
    private readonly jwt: jwtService,
    private tokenService: TokenService,
  ) {}

  async signupUser(dto: SignupDto){
    //find if user exists

    try {
      const userExist = await this.userModel.findOne({email: dto.email})

      if(userExist){
        throw new ConflictException("Email already exist")
    }

      const token = Math.floor(100000 + Math.random() * 900000).toString()
      
      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash(dto.password, salt)

      const user = await this.userModel.create({
        username: dto.username,
        email: dto.email,
        password: hashedPassword,
        verificationToken: token,
        verificationTokenExpiresAt: Date.now() + 20  * 60 * 1000  //20 mins

        
      })

      //await sendVerificationEmail(user)
      const payload ={
        username: user.username,
        email: user.email,
        token: user.verificationToken,
        userId: user._id,
      }
      await this.publisher.publish("user.created", payload)

      return {success: true, message: "user account created successfully"}
      
    } catch (error: any) {
      console.log(error)
      throw new HttpException(error.message, 400)
    }

    
    
  }

  async verifyEmail(code: string){

    try {

      const user = await this.userModel.findOne({
        isVerified: false,
        verificationToken: code,
        verificationTokenExpiresAt: { $gt: Date.now() }
      })

      if(!user){
        throw new HttpException("Invalid or Expired verification code", HttpStatus.BAD_REQUEST)
      }
      
  
      user.emailVerified = true

      user.verificationTokenExpiresAt = new Date(Date.now())

      await user.save()

      const payload = {
        email: user.email,
        name: user.username,
        userId: user._id
        
      }
      this.publisher.publish("user.verified", payload ) 
      console.log("user verified successfully")

      const { accessToken, refreshToken } = await this.tokenService.generateTokens(String(user._id), user.email, user.tokenVersion)

      
      return ({ accessToken, refreshToken, user })
    } catch (error: any) {
      console.log("error verifying email", error.message)
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR)
    }
  } 
  
/**
  
  async generateTokens(userId: string, email: string, tokenVersion: number) {
    const tokenId = randomUUID();

    const [accessToken, refreshToken] = await Promise.all([
      
      this.jwt.signAsync(
        {
          sub: userId,
          email,
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
          version: tokenVersion,
        },
        {
          secret: process.env.JWT_REFRESH_SECRET!,
          expiresIn: '7d',
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

**/
  
}
