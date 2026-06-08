import { Socket } from 'socket.io';
import { CallHistoryService } from './call-history.service';
export declare class CallHistoryGateway {
    private readonly callHistoryService;
    constructor(callHistoryService: CallHistoryService);
    handleCallStarted(client: Socket, data: {
        callerId: string;
        receiverId: string;
        roomName?: string;
        callType?: string;
    }): Promise<(import("mongoose").Document<unknown, {}, import("./call-history.schema").CallHistoryDocument, {}, import("mongoose").DefaultSchemaOptions> & import("./call-history.schema").CallHistory & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | undefined>;
    handleCallEnded(client: Socket, data: {
        id: string;
        duration: number;
    }): Promise<void>;
    handleCallRejected(client: Socket, data: {
        id: string;
    }): Promise<void>;
    handleCallMissed(client: Socket, data: {
        id: string;
    }): Promise<void>;
}
