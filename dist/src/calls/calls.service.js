"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CallsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const redis_service_1 = require("../redis/redis.service");
const users_entity_1 = require("../users/users.entity");
const call_history_service_1 = require("../call-history/call-history.service");
let CallsService = class CallsService {
    redisService;
    usersRepository;
    callHistoryService;
    constructor(redisService, usersRepository, callHistoryService) {
        this.redisService = redisService;
        this.usersRepository = usersRepository;
        this.callHistoryService = callHistoryService;
    }
    async startVideoCall(currentUserId, receiverId) {
        if (currentUserId === receiverId) {
            throw new common_1.BadRequestException('Cannot call yourself');
        }
        const caller = await this.usersRepository.findOne({
            where: {
                id: Number(currentUserId),
            },
        });
        const receiver = await this.usersRepository.findOne({
            where: {
                id: Number(receiverId),
            },
        });
        if (!caller) {
            throw new common_1.BadRequestException('Caller not found');
        }
        if (!receiver) {
            throw new common_1.BadRequestException('Receiver not found');
        }
        if ((caller.coins || 0) < 25) {
            throw new common_1.BadRequestException('Not enough coins');
        }
        const callerBusy = await this.redisService.isBusy(currentUserId);
        const receiverBusy = await this.redisService.isBusy(receiverId);
        const callerMatchedTo = await this.redisService.getMatched(currentUserId);
        const receiverMatchedTo = await this.redisService.getMatched(receiverId);
        const existingCallerCallId = await this.redisService.get(`user_call:${currentUserId}`);
        const existingReceiverCallId = await this.redisService.get(`user_call:${receiverId}`);
        const isSameMatchedPair = callerMatchedTo === receiverId &&
            receiverMatchedTo === currentUserId;
        const hasExistingCall = existingCallerCallId != null &&
            existingReceiverCallId != null &&
            existingCallerCallId === existingReceiverCallId;
        if ((callerBusy || receiverBusy) &&
            !isSameMatchedPair) {
            throw new common_1.BadRequestException('User already in call');
        }
        if (isSameMatchedPair &&
            hasExistingCall) {
            return {
                callId: existingCallerCallId,
                status: 'started',
                message: 'Call already active',
            };
        }
        const matched = await this.redisService.getMatched(receiverId);
        if (matched &&
            matched !== currentUserId) {
            throw new common_1.BadRequestException('User already matched');
        }
        await this.redisService.setBusy(currentUserId);
        await this.redisService.setBusy(receiverId);
        const callId = `call_${Date.now()}`;
        await this.redisService.set(`call:${callId}`, {
            callId,
            callerId: currentUserId,
            receiverId,
            startedAt: new Date(),
            status: 'started',
        }, 7200);
        await this.redisService.set(`user_call:${currentUserId}`, callId, 7200);
        await this.redisService.set(`user_call:${receiverId}`, callId, 7200);
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
        }
        catch (error) {
            console.error('Failed to create call history record:', error);
        }
        console.log(`📞 Call Started: ${callId}`);
        return {
            callId,
            status: 'started',
            message: 'Call started successfully',
        };
    }
    async updateCallStatus(callId, status) {
        const call = await this.redisService.get(`call:${callId}`);
        if (call) {
            call.status = status;
            await this.redisService.set(`call:${callId}`, call, 7200);
        }
        await this.callHistoryService.updateCallStatus(callId, status);
    }
    async endVideoCall(callId) {
        const call = await this.redisService.get(`call:${callId}`);
        if (!call) {
            throw new common_1.BadRequestException('Call not found');
        }
        const startTime = new Date(call.startedAt);
        const endTime = new Date();
        const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
        try {
            await this.callHistoryService.endCallByCallId(callId, duration, 'COMPLETED', call.callerId, call.receiverId);
        }
        catch (error) {
            console.error('Failed to update call history record:', error);
        }
        await this.redisService.removeBusy(call.callerId);
        await this.redisService.removeBusy(call.receiverId);
        await this.redisService.clearMatched(call.callerId);
        await this.redisService.clearMatched(call.receiverId);
        await this.redisService.del(`call:${callId}`);
        await this.redisService.del(`user_call:${call.callerId}`);
        await this.redisService.del(`user_call:${call.receiverId}`);
        console.log(`📴 Call Ended: ${callId}`);
        return {
            status: 'ended',
        };
    }
};
exports.CallsService = CallsService;
exports.CallsService = CallsService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(users_entity_1.User)),
    __metadata("design:paramtypes", [redis_service_1.RedisService,
        typeorm_2.Repository,
        call_history_service_1.CallHistoryService])
], CallsService);
//# sourceMappingURL=calls.service.js.map