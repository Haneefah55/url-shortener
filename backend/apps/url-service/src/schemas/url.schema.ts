
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Url extends Document {

	
  @Prop({ required: true, unique: true })
  shortCode: string;

  @Prop({ required: true })
  longUrl: string;

  @Prop({ default: 0 })
  clicks: number;

		createdAt: Date;
  updatedAt: Date;

		@Prop({ required: true })
  userId: string;

}

export const UrlSchema = SchemaFactory.createForClass(Url);