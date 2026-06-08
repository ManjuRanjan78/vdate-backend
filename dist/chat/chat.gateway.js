"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const chat_service_1 = require("./chat.service");
let ChatGateway = class ChatGateway {
    chatService;
    server;
    constructor(chatService) {
        this.chatService = chatService;
    }
    async handleConnection(client) {
        const userId = Number(client.handshake.query.userId);
        if (!Number.isNaN(userId) && userId > 0) {
            client.join(`chat_user_${userId}`);
            await this.sendConversationUpdate(userId);
            await this.sendBadgeUpdate(userId);
        }
    }
    handleDisconnect(client) {
        const userId = client.handshake.query.userId;
        if (userId) {
            client.leave(`chat_user_${userId}`);
        }
    }
    async sendBadgeUpdate(userId) {
        const unreadCount = await this.chatService.getUnreadBadgeCount(userId);
        this.server.to(`chat_user_${userId}`).emit('chat_badge_updated', { unreadCount });
    }
    async sendConversationUpdate(userId) {
        const conversations = await this.chatService.getChatRooms(userId);
        this.server.to(`chat_user_${userId}`).emit('conversation_updated', conversations);
    }
    async processChatMessage(client, data) {
        try {
            const senderId = Number(client.handshake.query.userId);
            if (!senderId)
                return;
            const message = await this.chatService.sendChatMessage(senderId, {
                roomId: data.roomId,
                receiverId: data.receiverId,
                message: data.message,
                messageTemplateId: data.messageTemplateId,
                clientMessageId: data.clientMessageId,
            });
            const receiverId = message.receiverId;
            client.emit('chat_message', message);
            client.emit('message_sent', message);
            client.emit('message_delivered', message);
            this.server.to(`chat_user_${receiverId}`).emit('chat_message', message);
            this.server.to(`chat_user_${receiverId}`).emit('message_received', message);
            if (!message.isSystem) {
                const senderName = await this.chatService.getUserName(senderId);
                const unreadCount = await this.chatService.getUnreadBadgeCount(receiverId);
                this.server.to(`chat_user_${receiverId}`).emit('chat_notification', {
                    roomId: message.roomId,
                    senderId,
                    senderName,
                    text: message.text,
                    notificationText: `You received a message from ${senderName}`,
                    unreadCount,
                });
            }
            if (message.roomCreated) {
                this.server.to(`chat_user_${receiverId}`).emit('chat_room_created', {
                    roomId: message.roomId,
                    senderId,
                    receiverId,
                });
                client.emit('chat_room_created', {
                    roomId: message.roomId,
                    senderId,
                    receiverId,
                });
            }
            await this.sendConversationUpdate(senderId);
            await this.sendConversationUpdate(receiverId);
            await this.sendBadgeUpdate(receiverId);
            return message;
        }
        catch (error) {
            client.emit('error', { message: error?.message ?? String(error) });
        }
    }
    async handleSendMessage(client, data) {
        return this.processChatMessage(client, data);
    }
    async handleChatMessage(client, data) {
        return this.processChatMessage(client, data);
    }
    async handleMarkRead(client, data) {
        try {
            const userId = Number(client.handshake.query.userId);
            if (!userId)
                return;
            let room = null;
            if (data.roomId) {
                room = await this.chatService.getChatRoomById(userId, data.roomId);
            }
            else if (data.friendId != null) {
                room = await this.chatService.getChatRoomByFriend(userId, data.friendId);
            }
            if (!room) {
                return;
            }
            await this.chatService.markAsRead(userId, room._id.toString());
            const friendId = room.user1Id === userId ? room.user2Id : room.user1Id;
            const roomId = room._id.toString();
            client.emit('chat_read', { roomId, userId });
            this.server.to(`chat_user_${friendId}`).emit('chat_read', { roomId, userId });
            await this.sendConversationUpdate(userId);
            await this.sendConversationUpdate(friendId);
            await this.sendBadgeUpdate(userId);
        }
        catch (error) {
            client.emit('error', { message: error?.message ?? String(error) });
        }
    }
    async handleTypingStarted(client, data) {
        try {
            const userId = Number(client.handshake.query.userId);
            if (!userId)
                return;
            let room = null;
            if (data.roomId) {
                room = await this.chatService.getChatRoomById(userId, data.roomId);
            }
            else if (data.friendId != null) {
                room = await this.chatService.getChatRoomByFriend(userId, data.friendId);
            }
            if (!room) {
                return;
            }
            const friendId = room.user1Id === userId ? room.user2Id : room.user1Id;
            const roomId = room._id.toString();
            this.server.to(`chat_user_${friendId}`).emit('chat_typing_started', {
                roomId,
                userId,
            });
        }
        catch (error) {
            client.emit('error', { message: error?.message ?? String(error) });
        }
    }
    async handleTypingStopped(client, data) {
        try {
            const userId = Number(client.handshake.query.userId);
            if (!userId)
                return;
            let room = null;
            if (data.roomId) {
                room = await this.chatService.getChatRoomById(userId, data.roomId);
            }
            else if (data.friendId != null) {
                room = await this.chatService.getChatRoomByFriend(userId, data.friendId);
            }
            if (!room) {
                return;
            }
            const friendId = room.user1Id === userId ? room.user2Id : room.user1Id;
            const roomId = room._id.toString();
            this.server.to(`chat_user_${friendId}`).emit('chat_typing_stopped', {
                roomId,
                userId,
            });
        }
        catch (error) {
            client.emit('error', { message: error?.message ?? String(error) });
        }
    }
};
exports.ChatGateway = ChatGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ChatGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('send_message'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleSendMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('chat_message'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleChatMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('mark_read'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleMarkRead", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('chat_typing_started'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleTypingStarted", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('chat_typing_stopped'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleTypingStopped", null);
exports.ChatGateway = ChatGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: { origin: '*' },
    }),
    __metadata("design:paramtypes", [chat_service_1.ChatService])
], ChatGateway);
//# sourceMappingURL=chat.gateway.js.map