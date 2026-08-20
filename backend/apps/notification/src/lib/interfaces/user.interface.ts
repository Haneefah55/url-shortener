

export interface User {

  username: string
  email: string
  password: string
  emailVerified: boolean
  image?: string
  tokenVersion: number
  lastLogin: Date
  plan: string
  urlLimit: number
  resetPasswordToken: string
  resetPasswordExpiresAt: Date
  verificationToken: string
  verificationTokenExpiresAt: Date
  
}