import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class ChatMessage extends Document {
  @Prop({ required: true })
  roomId!: string;

  @Prop({ required: true })
  senderId!: number;

  @Prop({ required: true })
  receiverId!: number;

  @Prop({ required: false })
  predefinedMessageId?: number;

  @Prop({ required: true })
  text!: string;

  @Prop({ required: false })
  deliveredAt!: Date;

  @Prop({ required: false })
  readAt!: Date;

  @Prop({ default: false })
  isAutoResponse!: boolean;

  @Prop({ default: false })
  isSystem!: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);
