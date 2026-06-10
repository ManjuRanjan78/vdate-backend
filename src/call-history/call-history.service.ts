import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CallHistory } from './call-history.entity';
import { User } from '../users/users.entity';

@Injectable()
export class CallHistoryService {
  constructor(
    @InjectRepository(CallHistory)
    private callHistoryRepo: Repository<CallHistory>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async createCallRecord(data: any) {
    try {
      const record = this.callHistoryRepo.create({
        callId: data.callId,
        callerId: Number(data.callerId),
        receiverId: Number(data.receiverId),
        roomName: data.roomName || '',
        callerName: data.callerName || '',
        receiverName: data.receiverName || '',
        callType: data.callType || 'VIDEO',
        duration: 0,
        status: data.status || 'STARTED',
        startedAt: data.startedAt || new Date(),
        endedAt: data.endedAt || null,
      });
      const savedRecord = await this.callHistoryRepo.save(record);
      return savedRecord;
    } catch (error) {
      console.error('Error creating call record:', error);
      throw error;
    }
  }

  async updateCallStatus(callId: string, status: string) {
    try {
      const record = await this.callHistoryRepo.findOne({ where: { callId } });
      if (!record) return null;
      record.status = status;
      if (status === 'MISSED' || status === 'REJECTED' || status === 'COMPLETED') {
        record.endedAt = new Date();
      }
      return await this.callHistoryRepo.save(record);
    } catch (error) {
      console.error('Error updating call status:', error);
      throw error;
    }
  }

  async endCallRecord(id: string, duration: number, status: string) {
    try {
      const record = await this.callHistoryRepo.findOne({ where: { id } });
      if (!record) throw new NotFoundException('Call record not found');
      
      record.duration = duration;
      record.status = status;
      record.endedAt = new Date();
      return await this.callHistoryRepo.save(record);
    } catch (error) {
      console.error('Error ending call record:', error);
      throw error;
    }
  }

  async getUserCallHistory(userId: string) {
    try {
      const userIdNum = Number(userId);
      const records = await this.callHistoryRepo.find({
        where: [
          { callerId: userIdNum },
          { receiverId: userIdNum }
        ],
        order: { createdAt: 'DESC' }
      });

      const uniqueIds = new Set<number>();
      for (const record of records) {
        if (record.callerId) uniqueIds.add(record.callerId);
        if (record.receiverId) uniqueIds.add(record.receiverId);
      }

      const idsToQuery = Array.from(uniqueIds);
      const users = idsToQuery.length
          ? await this.userRepo.findByIds(idsToQuery)
          : [];

      const userMap = new Map(users.map((user) => [user.id, user]));

      return records.map((record) => {
        const callerIdNum = record.callerId;
        const receiverIdNum = record.receiverId;
        const otherUserId = callerIdNum === userIdNum ? receiverIdNum : callerIdNum;
        const otherUser = userMap.get(otherUserId);
        const callerName = record.callerName || '';
        const receiverName = record.receiverName || '';
        const otherUserName = callerIdNum === userIdNum
            ? receiverName || otherUser?.name || otherUser?.email || otherUserId.toString()
            : callerName || otherUser?.name || otherUser?.email || otherUserId.toString();
        const otherUserImage = otherUser?.imageUrl || '';

        return {
          id: record.id,
          callId: record.id,
          callerId: record.callerId.toString(),
          receiverId: record.receiverId.toString(),
          callerName,
          receiverName,
          otherUserName,
          otherUserImage,
          otherUserId: otherUserId.toString(),
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
      const record = await this.callHistoryRepo.findOne({ where: { id } });
      if (!record) throw new NotFoundException('Call record not found');
      return record;
    } catch (error) {
      console.error('Error getting call record:', error);
      throw error;
    }
  }

  async endCallByCallId(callId: string, duration: number, status: string, callerId: string, receiverId: string) {
    try {
      let record = await this.callHistoryRepo.findOne({
        where: {
          callerId: Number(callerId),
          receiverId: Number(receiverId),
          status: 'STARTED'
        }
      });

      if (!record) {
        record = this.callHistoryRepo.create({
          callerId: Number(callerId),
          receiverId: Number(receiverId),
          duration,
          status,
          endedAt: new Date(),
        });
      } else {
        record.duration = duration;
        record.status = status;
        record.endedAt = new Date();
      }

      return await this.callHistoryRepo.save(record);
    } catch (error) {
      console.error('Error ending call by callId:', error);
      throw error;
    }
  }
}
