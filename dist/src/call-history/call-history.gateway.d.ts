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
    }): Promise<import("./call-history.entity").CallHistory | undefined>;
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
