import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { User } from '../users/users.entity';
import { SocketGateway } from '../socket/socket.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepo: Repository<Notification>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @Inject(forwardRef(() => SocketGateway))
    private socketGateway: SocketGateway,
  ) {}

  async create(data: {
    senderId: number;
    receiverId: number;
    type: string;
    title: string;
    message: string;
  }) {
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

  async getUnreadCount(userId: number) {
    const count = await this.notificationsRepo.count({
      where: { receiverId: userId, isRead: false },
    });
    return { count };
  }

  async findAllByUserId(userId: number) {
    const notifications = await this.notificationsRepo.find({
      where: { receiverId: userId },
      order: { createdAt: 'DESC' },
    });

    const senderIds = notifications.map(n => n.senderId);
    const senders = await this.userRepo.find({
      where: { id: In(senderIds) },
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

  async markAsRead(id: number) {
    await this.notificationsRepo.update(id, { isRead: true });
    return this.notificationsRepo.findOne({ where: { id } });
  }

  async markAllAsRead(userId: number) {
    await this.notificationsRepo.update({ receiverId: userId }, { isRead: true });
    return { success: true };
  }

  async deleteNotification(senderId: number, receiverId: number, type: string) {
    await this.notificationsRepo.delete({
      senderId,
      receiverId,
      type,
    });
    const unreadCount = await this.getUnreadCount(receiverId);
    this.socketGateway.server.to('user_' + receiverId).emit('notification_deleted', { senderId, type });
    this.socketGateway.server.to('user_' + receiverId).emit('notification_count_updated', unreadCount);
  }
}

