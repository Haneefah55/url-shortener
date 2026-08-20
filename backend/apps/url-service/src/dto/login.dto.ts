
import { SignupDto } from './signup.dto'
import { PartialType } from '@nestjs/mapped-types'

export class LoginDto extends PartialType(SignupDto) {
}