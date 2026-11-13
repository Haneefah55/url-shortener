
import { IsUrl, IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class CreateUrlDto {

  @IsNotEmpty()
  @IsUrl({}, { message: 'Invalid URL format' })
  originalUrl!: string;

  @IsString()
  @IsNotEmpty()
  userId!: string
	
  @IsOptional()
  @IsString()
  customCode?: string;
}


