
import { IsUrl, IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class CreateUrlDto {
	
 @IsUrl()
 longUrl: string;

	@IsString()
	@IsNotEmpty()
	userId: string
	
 @IsOptional()
 @IsString()
 customCode?: string;
}