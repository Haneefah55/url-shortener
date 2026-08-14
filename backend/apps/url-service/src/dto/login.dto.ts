
import { IsString, IsNotEmpty, IsEmail } from 'class-validator';

export class LoginDto {
  
	@IsEmail()
  @IsNotEmpty({message: "email is required"})
	email!: string
	
 
  @IsString({message: "password must be a string"})
  @IsNotEmpty({message: "password is required"})
   password!: string;
}