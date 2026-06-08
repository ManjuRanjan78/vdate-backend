import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
export declare class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly chatService;
    server: Server;
    constructor(chatService: ChatService);
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): void;
    sendBadgeUpdate(userId: number): Promise<void>;
    sendConversationUpdate(userId: number): Promise<void>;
    processChatMessage(client: Socket, data: {
        roomId?: string;
        receiverId?: number;
        message?: string;
        messageTemplateId?: number;
        clientMessageId?: string;
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
    } | undefined>;
    handleSendMessage(client: Socket, data: {
        roomId?: string;
        receiverId?: number;
        message?: string;
        messageTemplateId?: number;
        clientMessageId?: string;
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
    } | undefined>;
    handleChatMessage(client: Socket, data: {
        roomId?: string;
        receiverId?: number;
        message?: string;
        messageTemplateId?: number;
        clientMessageId?: string;
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
    } | undefined>;
    handleMarkRead(client: Socket, data: {
        roomId?: string;
        friendId?: number;
    }): Promise<void>;
    handleTypingStarted(client: Socket, data: {
        roomId?: string;
        friendId?: number;
    }): Promise<void>;
    handleTypingStopped(client: Socket, data: {
        roomId?: string;
        friendId?: number;
    }): Promise<void>;
}
