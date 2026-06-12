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
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const notification_entity_1 = require("./entities/notification.entity");
const users_entity_1 = require("../users/users.entity");
const socket_gateway_1 = require("../socket/socket.gateway");
let NotificationsService = class NotificationsService {
    notificationsRepo;
    userRepo;
    socketGateway;
    constructor(notificationsRepo, userRepo, socketGateway) {
        this.notificationsRepo = notificationsRepo;
        this.userRepo = userRepo;
        this.socketGateway = socketGateway;
    }
    async create(data) {
        const notification = this.notificationsRepo.create({
            ...data,
            senderId: Number(data.senderId),
            receiverId: Number(data.receiverId),
            isRead: false,
        });
        const savedNotification = await this.notificationsRepo.save(notification);
        const unreadCount = await this.getUnreadCount(Number(data.receiverId));
        this.socketGateway.server.to('user_' + data.receiverId).emit('notification_count_updated', unreadCount);
        return savedNotification;
    }
    async getUnreadCount(userId) {
        const count = await this.notificationsRepo.count({
            where: { receiverId: userId, isRead: false },
        });
        return { count };
    }
    async findAllByUserId(userId) {
        const notifications = await this.notificationsRepo.find({
            where: { receiverId: userId },
            order: { createdAt: 'DESC' },
        });
        const senderIds = notifications.map(n => n.senderId);
        const senders = await this.userRepo.find({
            where: { id: (0, typeorm_2.In)(senderIds) },
        });
        return notifications.map(n => {
            const sender = senders.find(s => s.id === n.senderId);
            return {
                ...n,
                sender: sender ? {
                    id: sender.id,
                    name: sender.name || sender.email || 'Unknown',
                    imageUrl: sender.imageUrl || '',
                } : null,
            };
        });
    }
    async markAsRead(id) {
        await this.notificationsRepo.update(id, { isRead: true });
        return this.notificationsRepo.findOne({ where: { id } });
    }
    async markAllAsRead(userId) {
        await this.notificationsRepo.update({ receiverId: userId }, { isRead: true });
        return { success: true };
    }
    async deleteNotification(senderId, receiverId, type) {
        await this.notificationsRepo.delete({
            senderId,
            receiverId,
            type,
        });
        const unreadCount = await this.getUnreadCount(receiverId);
        this.socketGateway.server.to('user_' + receiverId).emit('notification_deleted', { senderId, type });
        this.socketGateway.server.to('user_' + receiverId).emit('notification_count_updated', unreadCount);
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(notification_entity_1.Notification)),
    __param(1, (0, typeorm_1.InjectRepository)(users_entity_1.User)),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => socket_gateway_1.SocketGateway))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        socket_gateway_1.SocketGateway])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map