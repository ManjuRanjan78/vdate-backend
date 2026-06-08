import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CallHistoryDocument = CallHistory & Document;

@Schema({ timestamps: true })
export class CallHistory {
  @Prop({ required: true })
  callerId: string;

  @Prop({ required: true })
  receiverId: string;

  @Prop()
  roomName: string;

  @Prop()
  callerName: string;

  @Prop()
  receiverName: string;

  @Prop({ default: 'VIDEO' })
  callType: string;

  @Prop({ type: Number, default: 0 })
  duration: number;

  @Prop({ default: 'STARTED' })
  status: string; // MISSED, COMPLETED, REJECTED, CANCELLED, STARTED

  @Prop({ type: Date })
  startedAt: Date;

  @Prop({ type: Date })
  endedAt: Date;

  // Timestamps added by Mongoose when `timestamps: true` is set on the schema.
  @Prop({ type: Date })
  createdAt?: Date;

  @Prop({ type: Date })
  updatedAt?: Date;
}

export const CallHistorySchema = SchemaFactory.createForClass(CallHistory);
