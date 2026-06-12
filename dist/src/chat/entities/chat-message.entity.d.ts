export declare class ChatMessage {
    id: string;
    roomId: string;
    senderId: number;
    receiverId: number;
    predefinedMessageId?: number;
    text: string;
    deliveredAt?: Date;
    readAt?: Date;
    isAutoResponse: boolean;
    isSystem: boolean;
    createdAt: Date;
    updatedAt: Date;
}
