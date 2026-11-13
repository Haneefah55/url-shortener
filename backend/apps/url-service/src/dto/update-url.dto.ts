import { IsOptional, IsUrl } from 'class-validator';

export class UpdateUrlDto {
  @IsOptional()
  @IsUrl({}, { message: 'Invalid URL format' })
  originalUrl?: string;
}
