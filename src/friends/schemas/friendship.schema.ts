import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum FriendStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

@Schema({ timestamps: true })
export class Friendship extends Document {
  @Prop({ required: true })
  user1Id: number; // sender

  @Prop({ required: true })
  user2Id: number; // receiver

  @Prop({ required: true, enum: FriendStatus, default: FriendStatus.PENDING })
  status: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const FriendshipSchema = SchemaFactory.createForClass(Friendship);
