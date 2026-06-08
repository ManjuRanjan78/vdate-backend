import { CallHistoryService } from './call-history.service';
export declare class CallHistoryController {
    private readonly callHistoryService;
    constructor(callHistoryService: CallHistoryService);
    create(createData: any): Promise<import("mongoose").Document<unknown, {}, import("./call-history.schema").CallHistoryDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./call-history.schema").CallHistory & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
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
        roomName: string;
        callType: string;
        duration: number;
        status: string;
        startedAt: Date;
        endedAt: Date;
        createdAt: Date;
    }[]>;
    findById(id: string): Promise<import("mongoose").Document<unknown, {}, import("./call-history.schema").CallHistoryDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./call-history.schema").CallHistory & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    endCall(id: string, duration: number, status: string): Promise<import("mongoose").Document<unknown, {}, import("./call-history.schema").CallHistoryDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./call-history.schema").CallHistory & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
}
