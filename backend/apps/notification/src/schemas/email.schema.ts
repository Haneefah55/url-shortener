import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export enum EmailStatus {
  Failed = 'failed',
  Pending = 'pending',
  Sent = 'sent',
}

export type EmailDocument = HydratedDocument<Email>;

@Schema({ timestamps: true })
export class Email {

  @Prop({ type: String, required: true })
  userId!: string;

  @Prop({ type: String, required: true })
  email!: string;

  @Prop({ type: String, required: true })
  type!: string;

  @Prop({
    type: String,
    enum: EmailStatus,
    default: EmailStatus.Pending,
  })
  status!: EmailStatus;

  @Prop({ type: Number, default: 0 })
  attempts!: number;

  @Prop({ type: Boolean, default: false })
  retryable!: boolean;

  @Prop({ type: String })
  error?: string;
}

export const EmailSchema = SchemaFactory.createForClass(Email);