import { ChatService } from './chat.service';
export declare class ChatController {
    private readonly chatService;
    constructor(chatService: ChatService);
    getPredefinedMessages(): Promise<import("./entities/message-template.entity").MessageTemplate[]>;
    getChatRooms(req: any): Promise<any[]>;
    getConversations(req: any): Promise<any[]>;
    getMessages(req: any, roomId: string): Promise<{
        id: string;
        roomId: string;
        senderId: number;
        receiverId: number;
        predefinedMessageId: number | undefined;
        text: string;
        deliveredAt: Date;
        readAt: Date;
        createdAt: Date | undefined;
        isSystem: boolean;
        messageTemplate: string;
    }[]>;
    sendPredefined(req: any, body: {
        roomId?: string;
        receiverId?: string;
        messageTemplateId: string;
    }): Promise<{
        id: string;
        clientMessageId: string | undefined;
        roomId: any;
        senderId: number;
        receiverId: any;
        predefinedMessageId: number | undefined;
        text: string;
        deliveredAt: Date;
        readAt: Date;
        createdAt: Date | undefined;
        isSystem: boolean;
        roomCreated: boolean;
    }>;
    sendMessage(req: any, body: {
        roomId?: string;
        receiverId?: string;
        message?: string;
    }): Promise<{
        id: string;
        clientMessageId: string | undefined;
        roomId: any;
        senderId: number;
        receiverId: any;
        predefinedMessageId: number | undefined;
        text: string;
        deliveredAt: Date;
        readAt: Date;
        createdAt: Date | undefined;
        isSystem: boolean;
        roomCreated: boolean;
    }>;
    markAsRead(req: any, body: {
        roomId?: string;
        friendId?: string;
    }): Promise<{
        success: boolean;
    }>;
}
