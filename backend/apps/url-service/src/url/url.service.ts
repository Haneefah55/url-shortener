import { Injectable, HttpException, HttpStatus, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RabbitMQPublisherService} from '../rabbitMQ/rabbitmq-publisher.service'
import * as geoip from 'geoip-lite';
import { Url, UrlDocument } from '../schemas/url.schema';
import { CreateUrlDto } from '../dto/create-url.dto';
import { UpdateUrlDto } from '../dto/update-url.dto';
import * as crypto from 'crypto';

@Injectable()
export class UrlService {
  constructor(
    @InjectModel(Url.name) private readonly urlModel: Model<UrlDocument>,
    private readonly publisher: RabbitMQPublisherService, 
  ) {}

  // Helper to generate a unique short code
  private generateShortCode(): string {
    return crypto.randomBytes(4).toString('base64url').substring(0, 6);
  }

  async createUrl(dto: CreateUrlDto, userId?: string) {
    try {
      let shortCode = dto.customCode || this.generateShortCode();

      // Check if custom code already exists
      if (shortCode) {
        const existing = await this.urlModel.findOne({ shortCode });
        if (existing) {
          throw new ConflictException('Custom url is already taken');
        }
      }

      const newUrl = await this.urlModel.create({
        originalUrl: dto.originalUrl,
        shortCode,
        userId,
      });

      // Publish event to Analytics & Notification microservices
      const eventPayload = {
        urlId: newUrl._id,
        shortCode: newUrl.shortCode,
        originalUrl: newUrl.originalUrl,
        userId,
        createdAt: newUrl.createdAt,
      };
      this.publisher.publish('url.created', eventPayload);

      return { success: true, data: newUrl };
    } catch (error: any) {
      throw new HttpException(error.message || 'Failed to create short URL', error.status || HttpStatus.BAD_REQUEST);
    }
  }

  async getUserUrls(userId: string) {
    return this.urlModel.find({ userId }).sort({ createdAt: -1 });
  }

  async getOriginalUrl(shortCode: string, req: any) {
    const urlRecord = await this.urlModel.findOne({ shortCode, isActive: true });
    
    if (!urlRecord) {
      throw new NotFoundException('Short URL not found or inactive');
    }

    // Increment click count
    urlRecord.clicks += 1;
    await urlRecord.save();


    
    // Extract detailed user & request metadata
    const rawIp = 
      req?.headers['x-forwarded-for'] || 
      req?.socket?.remoteAddress || 
      req?.ip || 
      '';

    // Clean IP (handle comma-separated arrays from proxies and remove IPv6 prefix if present)
    let ipAddress = Array.isArray(rawIp) ? rawIp[0] : rawIp.split(',')[0].trim();
    if (ipAddress.startsWith('::ffff:')) {
      ipAddress = ipAddress.substring(7);
    }

    const userAgent = req?.headers['user-agent'] || 'unknown';
    const referer = req?.headers['referer'] || req?.headers['referrer'] || 'direct';
    const clickedAt = new Date();

    // Lookup Country & State using geoip-lite
    
    const geo = geoip.lookup(ipAddress);
    const country = geo ? geo.country : 'Unknown'; // e.g., 'US', 'NG', 'CA'
    const state = geo ? geo.region : 'Unknown';   // e.g., 'TX', 'LA', 'ON'
    const city = geo ? geo.city : 'Unknown';

    // 4. Construct comprehensive event payload for Analytics
    const clickPayload = {
      event: 'url.clicked',
      data: {
        urlId: urlRecord._id,
        shortCode: urlRecord.shortCode,
        originalUrl: urlRecord.originalUrl,
        userId: urlRecord.userId,
        totalClicks: urlRecord.clicks,
        metadata: {
          ipAddress,
          country,
          state,
          city,
          userAgent,
          referer,
          clickedAt,
        },
      },
    };
    

    // Publish event to Analytics microservice for tracking clicks
    this.publisher.publish('url.clicked', clickPayload);

    return urlRecord.originalUrl;
  }

  async updateUrl(userId: string, urlId: string, dto: UpdateUrlDto) {
    const urlRecord = await this.urlModel.findOne({ _id: urlId, userId });

    if (!urlRecord) {
      throw new NotFoundException('URL not found or unauthorized');
    }

    if (dto.originalUrl) {
      urlRecord.originalUrl = dto.originalUrl;
    }

    await urlRecord.save();

    // Publish update event
    this.publisher.publish('url.updated', {
      urlId: urlRecord._id,
      shortCode: urlRecord.shortCode,
      originalUrl: urlRecord.originalUrl,
      userId,
    });

    return { success: true, message: 'URL updated successfully', data: urlRecord };
  }
}
