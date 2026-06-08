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
exports.CallHistoryService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const mongoose_2 = require("mongoose");
const call_history_schema_1 = require("./call-history.schema");
const users_entity_1 = require("../users/users.entity");
let CallHistoryService = class CallHistoryService {
    callHistoryModel;
    userRepo;
    constructor(callHistoryModel, userRepo) {
        this.callHistoryModel = callHistoryModel;
        this.userRepo = userRepo;
    }
    async createCallRecord(data) {
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
        }
        catch (error) {
            console.error('Error creating call record:', error);
            throw error;
        }
    }
    async endCallRecord(id, duration, status) {
        try {
            const record = await this.callHistoryModel.findById(id);
            if (!record)
                throw new common_1.NotFoundException('Call record not found');
            record.duration = duration;
            record.status = status;
            record.endedAt = new Date();
            return await record.save();
        }
        catch (error) {
            console.error('Error ending call record:', error);
            throw error;
        }
    }
    async getUserCallHistory(userId) {
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
            const uniqueIds = new Set();
            for (const record of records) {
                if (record.callerId)
                    uniqueIds.add(record.callerId);
                if (record.receiverId)
                    uniqueIds.add(record.receiverId);
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
        }
        catch (error) {
            console.error('Error getting user call history:', error);
            throw error;
        }
    }
    async getCallRecordById(id) {
        try {
            const record = await this.callHistoryModel.findById(id);
            if (!record)
                throw new common_1.NotFoundException('Call record not found');
            return record;
        }
        catch (error) {
            console.error('Error getting call record:', error);
            throw error;
        }
    }
    async endCallByCallId(callId, duration, status, callerId, receiverId) {
        try {
            let record = await this.callHistoryModel.findOne({
                callerId: callerId?.toString() || '',
                receiverId: receiverId?.toString() || '',
                status: 'STARTED'
            });
            if (!record) {
                record = new this.callHistoryModel({
                    callerId: callerId?.toString() || '',
                    receiverId: receiverId?.toString() || '',
                    duration,
                    status,
                    endedAt: new Date(),
                });
            }
            else {
                record.duration = duration;
                record.status = status;
                record.endedAt = new Date();
            }
            return await record.save();
        }
        catch (error) {
            console.error('Error ending call by callId:', error);
            throw error;
        }
    }
};
exports.CallHistoryService = CallHistoryService;
exports.CallHistoryService = CallHistoryService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(call_history_schema_1.CallHistory.name)),
    __param(1, (0, typeorm_1.InjectRepository)(users_entity_1.User)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        typeorm_2.Repository])
], CallHistoryService);
//# sourceMappingURL=call-history.service.js.map