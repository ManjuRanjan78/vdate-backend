import { Repository } from 'typeorm';
import { CallHistory } from './call-history.entity';
import { User } from '../users/users.entity';
export declare class CallHistoryService {
    private callHistoryRepo;
    private userRepo;
    constructor(callHistoryRepo: Repository<CallHistory>, userRepo: Repository<User>);
    createCallRecord(data: any): Promise<CallHistory>;
    endCallRecord(id: string, duration: number, status: string): Promise<CallHistory>;
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
        roomName: string | undefined;
        callType: string;
        duration: number;
        status: string;
        startedAt: Date | undefined;
        endedAt: Date | undefined;
        createdAt: Date;
    }[]>;
    getCallRecordById(id: string): Promise<CallHistory>;
    endCallByCallId(callId: string, duration: number, status: string, callerId: string, receiverId: string): Promise<CallHistory>;
}
