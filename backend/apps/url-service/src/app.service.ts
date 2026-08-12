
import { Injectable, ConflictException, NotFoundException, BadRequestException, HttpException, HttpStatus} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { nanoid } from 'nanoid';
import { Url } from './schemas/url.schema';
import axios from 'axios';
import { CreateUrlDto } from './dto/create-url.dto';
import { RabbitMQPublisherService } from './events/rabbitmq-publisher.service'

@Injectable()
export class AppService {
  constructor(
    @InjectModel(Url.name) private urlModel: Model<Url>,
    private publisher: RabbitMQPublisherService,
  ) {}

  async create(dto: CreateUrlDto) {
   try {
   
				const { longUrl, userId } = dto

			/**	if(!userId){
				throw new BadRequestException("User id is required")
			} 
			//	if(!longUrl){
				throw new BadRequestException("longUrl is required")
			} **/

     const result = await this.checkUrl(longUrl);

if (!result.exists) {
  throw new BadRequestException(result.message);
}


			
					const shortCode = dto.customCode || nanoid(7);

    	const existing = await this.urlModel.findOne({ shortCode });
    	if (existing) throw new ConflictException('Code already taken');

    	const url = await this.urlModel.create({ 
						shortCode, 
						longUrl: dto.longUrl,
						userId: dto.userId
					});

    	this.publisher.publish('url.created', {
      shortCode: url.shortCode,
      longUrl: url.longUrl,
						userId: dto.userId,
      createdAt: url.createdAt,
    	});
				

    return url;
 	
   } catch (error: any) {
   	throw new HttpException(error.message, HttpStatus.BAD_REQUEST)
			}
			
		}

  async findByCode(code: string) {
    const url = await this.urlModel.findOne({ shortCode: code });
    if (!url) throw new NotFoundException('Short URL not found');

    this.publisher.publish('url.clicked', {
      shortCode: code,
      timestamp: new Date(),
    });

    return url;
  }
  
  async checkUrl(url: string) {
  try {
    const response = await axios.get(url, {
      timeout: 5000,
      maxRedirects: 5,
      validateStatus: () => true,
    });

    switch (response.status) {
      case 200:
        return {
          exists: true,
          statusCode: 200,
          message: 'URL is available',
        };

      case 301:
      case 302:
      case 307:
      case 308:
        return {
          exists: true,
          statusCode: response.status,
          message: 'URL is available but redirects',
        };

      case 401:
        return {
          exists: true,
          statusCode: 401,
          message: 'URL exists but requires authentication',
        };

      case 403:
        return {
          exists: true,
          statusCode: 403,
          message: 'URL exists but access is forbidden',
        };

      case 404:
        return {
          exists: false,
          statusCode: 404,
          message: 'URL does not exist',
        };

      case 500:
      case 502:
      case 503:
      case 504:
        return {
          exists: false,
          statusCode: response.status,
          message: 'The website is currently unavailable',
        };

      default:
        return {
          exists: false,
          statusCode: response.status,
          message: `Unexpected HTTP status: ${response.status}`,
        };
    }
  } catch (error) {
    return {
      exists: false,
      statusCode: null,
      message: 'Could not reach the URL',
    };
  }
  }

  

	
}