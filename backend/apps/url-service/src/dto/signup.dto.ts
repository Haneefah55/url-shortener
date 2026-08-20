


import { IsString, IsNotEmpty, IsEmail, MinLength } from 'class-validator';

export class SignupDto {

  @IsNotEmpty({message: "username is required"})
  @IsString({message: "username must be a string"})
  username: string
  
	@IsEmail()
  @IsNotEmpty({message: "email is required"})
	email: string
	
 
  @IsString({message: "password must be a string"})
  
  @MinLength(8)
   password: string;
}