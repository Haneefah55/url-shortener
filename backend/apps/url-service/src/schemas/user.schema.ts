import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

export type UserDocument = HydratedDocument<User>

@Schema({
  collection: 'user', 
  timestamps: true, 
})
export class User {

  @Prop({ type: String, required: true })
  username!: string

  @Prop({ type: String, required: true, unique: true, lowercase: true, trim: true })
  email!: string

  @Prop({ type: Boolean, default: false })
  emailVerified!: boolean

  @Prop({ type: String })
  image?: string

  @Prop({ type: Number})
  tokenVersion!: number


  @Prop({ default: Date.now})
  lastLogin!: Date

  
  @Prop({ type: String, default: 'free' })
  plan!: string

  @Prop({ type: Number, default: 50 })
  urlLimit!: number


  @Prop({ type: String });
  resetPasswordToken!: string
  
  @Prop({ type: Date });
  resetPasswordExpiresAt!: Date

  @Prop({ type: String})
  verificationToken!: string
  
  @Prop({ type: Date})
  verificationTokenExpiresAt!: Date
  
  createdAt?: Date
  updatedAt?: Date
}

export const UserSchema = SchemaFactory.createForClass(User)

