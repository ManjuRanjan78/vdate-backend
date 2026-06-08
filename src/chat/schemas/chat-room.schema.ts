import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class ChatRoom extends Document {
  @Prop({ required: true })
  user1Id: number;

  @Prop({ required: true })
  user2Id: number;

  @Prop()
  lastMessage?: string;

  @Prop()
  lastMessageAt?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ChatRoomSchema = SchemaFactory.createForClass(ChatRoom);
