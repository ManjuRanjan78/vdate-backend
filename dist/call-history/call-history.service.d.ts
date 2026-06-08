import { Repository } from 'typeorm';
import { Model } from 'mongoose';
import { CallHistory, CallHistoryDocument } from './call-history.schema';
import { User } from '../users/users.entity';
export declare class CallHistoryService {
    private callHistoryModel;
    private userRepo;
    constructor(callHistoryModel: Model<CallHistoryDocument>, userRepo: Repository<User>);
    createCallRecord(data: Partial<CallHistory>): Promise<import("mongoose").Document<unknown, {}, CallHistoryDocument, {}, import("mongoose").DefaultSchemaOptions> & CallHistory & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    endCallRecord(id: string, duration: number, status: string): Promise<import("mongoose").Document<unknown, {}, CallHistoryDocument, {}, import("mongoose").DefaultSchemaOptions> & CallHistory & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    getUserCallHistory(userId: string): Promise<{
        id: string;
        callId: string;
        callerId: string;
        receiverId: string;
        callerName: string;
        receiverName: string;
        otherUserName: string;
        otherUserImage: string;
        otherUserId: string;
        roomName: string;
        callType: string;
        duration: number;
        status: string;
        startedAt: Date;
        endedAt: Date;
        createdAt: Date;
    }[]>;
    getCallRecordById(id: string): Promise<import("mongoose").Document<unknown, {}, CallHistoryDocument, {}, import("mongoose").DefaultSchemaOptions> & CallHistory & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    endCallByCallId(callId: string, duration: number, status: string, callerId: string, receiverId: string): Promise<import("mongoose").Document<unknown, {}, CallHistoryDocument, {}, import("mongoose").DefaultSchemaOptions> & CallHistory & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
}
