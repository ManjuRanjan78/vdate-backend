import { CallHistoryService } from './call-history.service';
export declare class CallHistoryController {
    private readonly callHistoryService;
    constructor(callHistoryService: CallHistoryService);
    create(createData: any): Promise<import("./call-history.entity").CallHistory>;
    findByUser(userId: string): Promise<{
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
    findById(id: string): Promise<import("./call-history.entity").CallHistory>;
    endCall(id: string, duration: number, status: string): Promise<import("./call-history.entity").CallHistory>;
}
