import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Model } from 'mongoose';
import { CallHistory, CallHistoryDocument } from './call-history.schema';
import { User } from '../users/users.entity';

@Injectable()
export class CallHistoryService {
  constructor(
    @InjectModel(CallHistory.name)
    private callHistoryModel: Model<CallHistoryDocument>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async createCallRecord(data: Partial<CallHistory>) {
    try {
      const record = new this.callHistoryModel({
        callerId: data.callerId?.toString() || '',
        receiverId: data.receiverId?.toString() || '',
        roomName: data.roomName || '',
        callerName: data.callerName || '',
        receiverName: data.receiverName || '',
        callType: data.callType || 'VIDEO',
        duration: 0,
        status: data.status || 'STARTED',
        startedAt: data.startedAt || new Date(),
        endedAt: data.endedAt || null,
      });
      const savedRecord = await record.save();
      return savedRecord;
    } catch (error) {
      console.error('Error creating call record:', error);
      throw error;
    }
  }

  async endCallRecord(id: string, duration: number, status: string) {
    try {
      const record = await this.callHistoryModel.findById(id);
      if (!record) throw new NotFoundException('Call record not found');
      
      record.duration = duration;
      record.status = status;
      record.endedAt = new Date();
      return await record.save();
    } catch (error) {
      console.error('Error ending call record:', error);
      throw error;
    }
  }

  async getUserCallHistory(userId: string) {
    try {
      const userIdStr = userId?.toString() || '';
      const records = await this.callHistoryModel.find({
        $or: [
          { callerId: userIdStr },
          { receiverId: userIdStr }
        ]
      })
      .sort({ createdAt: -1 })
      .lean();

      const uniqueIds = new Set<string>();
      for (const record of records) {
        if (record.callerId) uniqueIds.add(record.callerId);
        if (record.receiverId) uniqueIds.add(record.receiverId);
      }

      const idsToQuery = Array.from(uniqueIds)
          .map((id) => Number(id))
          .filter((value) => !isNaN(value));

      const users = idsToQuery.length
          ? await this.userRepo.findByIds(idsToQuery)
          : [];

      const userMap = new Map(users.map((user) => [user.id.toString(), user]));

      return records.map((record) => {
        const callerId = record.callerId || '';
        const receiverId = record.receiverId || '';
        const otherUserId = callerId === userIdStr ? receiverId : callerId;
        const otherUser = userMap.get(otherUserId);
        const callerName = record.callerName || '';
        const receiverName = record.receiverName || '';
        const otherUserName = callerId === userIdStr
            ? receiverName || otherUser?.name || otherUser?.email || otherUserId
            : callerName || otherUser?.name || otherUser?.email || otherUserId;
        const otherUserImage = otherUser?.imageUrl || '';

        return {
          id: record._id?.toString() || '',
          callId: record._id?.toString() || '',
          callerId: record.callerId,
          receiverId: record.receiverId,
          callerName,
          receiverName,
          otherUserName,
          otherUserImage,
          otherUserId,
          roomName: record.roomName,
          callType: record.callType || 'VIDEO',
          duration: record.duration || 0,
          status: record.status || 'UNKNOWN',
          startedAt: record.startedAt,
          endedAt: record.endedAt,
          createdAt: record.createdAt || record.startedAt,
        };
      });
    } catch (error) {
      console.error('Error getting user call history:', error);
      throw error;
    }
  }

  async getCallRecordById(id: string) {
    try {
      const record = await this.callHistoryModel.findById(id);
      if (!record) throw new NotFoundException('Call record not found');
      return record;
    } catch (error) {
      console.error('Error getting call record:', error);
      throw error;
    }
  }

  async endCallByCallId(callId: string, duration: number, status: string, callerId: string, receiverId: string) {
    try {
      // Try to find by callId field if it exists, otherwise create or find by callerId+receiverId
      let record = await this.callHistoryModel.findOne({
        callerId: callerId?.toString() || '',
        receiverId: receiverId?.toString() || '',
        status: 'STARTED'
      });

      if (!record) {
        // If not found, create a new record to close
        record = new this.callHistoryModel({
          callerId: callerId?.toString() || '',
          receiverId: receiverId?.toString() || '',
          duration,
          status,
          endedAt: new Date(),
        });
      } else {
        record.duration = duration;
        record.status = status;
        record.endedAt = new Date();
      }

      return await record.save();
    } catch (error) {
      console.error('Error ending call by callId:', error);
      throw error;
    }
  }
}
