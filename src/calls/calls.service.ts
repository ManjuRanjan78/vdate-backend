import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';

import { InjectRepository }
from '@nestjs/typeorm';

import { Repository }
from 'typeorm';

import { RedisService }
from '../redis/redis.service';

import { User }
from '../users/users.entity';

import { CallHistoryService }
from '../call-history/call-history.service';

@Injectable()
export class CallsService {

  constructor(

    private readonly redisService:
      RedisService,

    @InjectRepository(User)
    private readonly usersRepository:
      Repository<User>,

    private readonly callHistoryService:
      CallHistoryService,
  ) {}

  // =========================
  // START VIDEO CALL
  // =========================

  async startVideoCall(
    currentUserId: string,
    receiverId: string,
  ) {

    // prevent self call
    if (
      currentUserId === receiverId
    ) {

      throw new BadRequestException(
        'Cannot call yourself',
      );
    }

    // =========================
    // GET USERS
    // =========================

    const caller =
      await this.usersRepository.findOne({
        where: {
          id: Number(currentUserId),
        },
      });

    const receiver =
      await this.usersRepository.findOne({
        where: {
          id: Number(receiverId),
        },
      });

    if (!caller) {

      throw new BadRequestException(
        'Caller not found',
      );
    }

    if (!receiver) {

      throw new BadRequestException(
        'Receiver not found',
      );
    }

    // =========================
    // MINIMUM COIN VALIDATION
    // =========================

    if (
      (caller.coins || 0) < 25
    ) {

      throw new BadRequestException(
        'Not enough coins',
      );
    }

    // =========================
    // CHECK BUSY
    // =========================

    const callerBusy =
      await this.redisService.isBusy(
        currentUserId,
      );

    const receiverBusy =
      await this.redisService.isBusy(
        receiverId,
      );

    const callerMatchedTo =
      await this.redisService.getMatched(
        currentUserId,
      );

    const receiverMatchedTo =
      await this.redisService.getMatched(
        receiverId,
      );

    const existingCallerCallId =
      await this.redisService.get(
        `user_call:${currentUserId}`,
      );

    const existingReceiverCallId =
      await this.redisService.get(
        `user_call:${receiverId}`,
      );

    const isSameMatchedPair =
      callerMatchedTo === receiverId &&
      receiverMatchedTo === currentUserId;

    const hasExistingCall =
      existingCallerCallId != null &&
      existingReceiverCallId != null &&
      existingCallerCallId === existingReceiverCallId;

    if (
      (callerBusy || receiverBusy) &&
      !isSameMatchedPair
    ) {

      throw new BadRequestException(
        'User already in call',
      );
    }

    // If the match already has an active call session, return it.
    if (
      isSameMatchedPair &&
      hasExistingCall
    ) {
      return {
        callId: existingCallerCallId,
        status: 'started',
        message:
          'Call already active',
      };
    }

    // =========================
    // CHECK MATCH LOCK
    // =========================

    const matched =
      await this.redisService.getMatched(
        receiverId,
      );

    if (
      matched &&
      matched !== currentUserId
    ) {

      throw new BadRequestException(
        'User already matched',
      );
    }

    // =========================
    // SET BUSY
    // =========================

    await this.redisService.setBusy(
      currentUserId,
    );

    await this.redisService.setBusy(
      receiverId,
    );

    // =========================
    // CREATE CALL ID
    // =========================

    const callId =
      `call_${Date.now()}`;

    // =========================
    // STORE SESSION
    // =========================

    await this.redisService.set(
      `call:${callId}`,
      {
        callId,
        callerId: currentUserId,
        receiverId,
        startedAt:
          new Date(),
        status: 'started',
      },
      7200,
    );

    await this.redisService.set(
      `user_call:${currentUserId}`,
      callId,
      7200,
    );

    await this.redisService.set(
      `user_call:${receiverId}`,
      callId,
      7200,
    );

    // =========================
    // CREATE CALL HISTORY RECORD
    // =========================

    try {
      const callerData = caller.name || `User ${currentUserId}`;
      const receiverData = receiver.name || `User ${receiverId}`;
      
      await this.callHistoryService.createCallRecord({
        callId,
        callerId: currentUserId,
        receiverId,
        roomName: receiverData,
        callerName: callerData,
        receiverName: receiverData,
        callType: 'VIDEO',
        status: 'INITIATED',
        startedAt: new Date(),
      });
    } catch (error) {
      console.error('Failed to create call history record:', error);
      // Don't throw - call should proceed even if history record fails
    }

    console.log(
      `📞 Call Started: ${callId}`,
    );

    return {

      callId,

      status: 'started',

      message:
        'Call started successfully',
    };
  }

  // =========================
  // UPDATE CALL STATUS
  // =========================

  async updateCallStatus(callId: string, status: string) {
    const call = await this.redisService.get(`call:${callId}`);
    if (call) {
      call.status = status;
      await this.redisService.set(`call:${callId}`, call, 7200);
    }
    await this.callHistoryService.updateCallStatus(callId, status);
  }

  // =========================
  // END VIDEO CALL
  // =========================

  async endVideoCall(
    callId: string,
  ) {

    const call =
      await this.redisService.get(
        `call:${callId}`,
      );

    if (!call) {

      throw new BadRequestException(
        'Call not found',
      );
    }

    // =========================
    // CALCULATE DURATION
    // =========================

    const startTime = new Date(call.startedAt);
    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

    // =========================
    // UPDATE CALL HISTORY RECORD
    // =========================

    try {
      await this.callHistoryService.endCallByCallId(
        callId,
        duration,
        'COMPLETED',
        call.callerId,
        call.receiverId,
      );
    } catch (error) {
      console.error('Failed to update call history record:', error);
      // Don't throw - call end should proceed even if history update fails
    }

    // =========================
    // REMOVE BUSY
    // =========================

    await this.redisService.removeBusy(
      call.callerId,
    );

    await this.redisService.removeBusy(
      call.receiverId,
    );

    // =========================
    // CLEAR MATCH LOCK
    // =========================

    await this.redisService.clearMatched(
      call.callerId,
    );

    await this.redisService.clearMatched(
      call.receiverId,
    );

    // =========================
    // REMOVE SESSION
    // =========================

    await this.redisService.del(
      `call:${callId}`,
    );

    await this.redisService.del(
      `user_call:${call.callerId}`,
    );

    await this.redisService.del(
      `user_call:${call.receiverId}`,
    );

    console.log(
      `📴 Call Ended: ${callId}`,
    );

    return {
      status: 'ended',
    };
  }
}