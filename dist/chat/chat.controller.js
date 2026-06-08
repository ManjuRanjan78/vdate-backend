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
exports.ChatController = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("mongoose");
const chat_service_1 = require("./chat.service");
let ChatController = class ChatController {
    chatService;
    constructor(chatService) {
        this.chatService = chatService;
    }
    getPredefinedMessages() {
        return this.chatService.getPredefinedMessages();
    }
    async getChatRooms(req) {
        const userId = req.user?.userId;
        if (!userId)
            throw new common_1.UnauthorizedException();
        return this.chatService.getChatRooms(Number(userId));
    }
    async getConversations(req) {
        const userId = req.user?.userId;
        if (!userId)
            throw new common_1.UnauthorizedException();
        return this.chatService.getChatRooms(Number(userId));
    }
    async getMessages(req, roomId) {
        const userId = req.user?.userId;
        if (!userId)
            throw new common_1.UnauthorizedException();
        let resolvedRoomId = roomId;
        if (!mongoose_1.Types.ObjectId.isValid(roomId)) {
            const friendId = Number(roomId);
            if (!Number.isNaN(friendId)) {
                const room = await this.chatService.findRoomByPair(Number(userId), friendId);
                if (room) {
                    resolvedRoomId = room._id.toString();
                }
            }
        }
        return this.chatService.getMessages(Number(userId), resolvedRoomId);
    }
    async sendPredefined(req, body) {
        const userId = req.user?.userId;
        if (!userId)
            throw new common_1.UnauthorizedException();
        if ((body.roomId == null || body.roomId.trim() === '') && !body.receiverId) {
            throw new common_1.BadRequestException('roomId or receiverId is required.');
        }
        return this.chatService.sendChatMessage(Number(userId), {
            roomId: body.roomId,
            receiverId: body.receiverId != null ? Number(body.receiverId) : undefined,
            messageTemplateId: Number(body.messageTemplateId),
        });
    }
    async sendMessage(req, body) {
        const userId = req.user?.userId;
        if (!userId)
            throw new common_1.UnauthorizedException();
        if ((body.roomId == null || body.roomId.trim() == '') && !body.receiverId) {
            throw new common_1.BadRequestException('roomId or receiverId is required.');
        }
        return this.chatService.sendChatMessage(Number(userId), {
            roomId: body.roomId,
            receiverId: body.receiverId != null ? Number(body.receiverId) : undefined,
            message: body.message,
        });
    }
    async markAsRead(req, body) {
        const userId = req.user?.userId;
        if (!userId)
            throw new common_1.UnauthorizedException();
        let roomId = body.roomId;
        if (!roomId && body.friendId) {
            const friendId = Number(body.friendId);
            if (!Number.isNaN(friendId)) {
                const room = await this.chatService.findRoomByPair(Number(userId), friendId);
                if (room) {
                    roomId = room._id.toString();
                }
            }
        }
        if (!roomId) {
            throw new common_1.BadRequestException('roomId or friendId is required.');
        }
        await this.chatService.markAsRead(Number(userId), roomId);
        return { success: true };
    }
};
exports.ChatController = ChatController;
__decorate([
    (0, common_1.Get)('predefined-messages'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "getPredefinedMessages", null);
__decorate([
    (0, common_1.Get)('rooms'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getChatRooms", null);
__decorate([
    (0, common_1.Get)('conversations'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getConversations", null);
__decorate([
    (0, common_1.Get)('messages/:roomId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('roomId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getMessages", null);
__decorate([
    (0, common_1.Post)('send-predefined'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "sendPredefined", null);
__decorate([
    (0, common_1.Post)('send'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "sendMessage", null);
__decorate([
    (0, common_1.Post)('mark-read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "markAsRead", null);
exports.ChatController = ChatController = __decorate([
    (0, common_1.Controller)('chat'),
    __metadata("design:paramtypes", [chat_service_1.ChatService])
], ChatController);
//# sourceMappingURL=chat.controller.js.map