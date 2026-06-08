export declare class CallHistory {
    id: string;
    callId: string;
    callerId: number;
    receiverId: number;
    roomName: string;
    callType: string;
    duration?: number;
    status: string;
    startedAt?: Date;
    endedAt?: Date;
    createdAt: Date;
}
