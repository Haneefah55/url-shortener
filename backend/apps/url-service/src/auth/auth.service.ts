import { Injectable } from '@nestjs/common';
import { User } from '../schemas/user.schema'
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class AuthService {

  constructor(
    @InjectModel(User.name) private userModel: Model<Url>,
  ) {}

  
}
