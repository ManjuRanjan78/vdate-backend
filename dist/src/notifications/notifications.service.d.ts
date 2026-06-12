import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { User } from '../users/users.entity';
import { SocketGateway } from '../socket/socket.gateway';
export declare class NotificationsService {
    private notificationsRepo;
    private userRepo;
    private socketGateway;
    constructor(notificationsRepo: Repository<Notification>, userRepo: Repository<User>, socketGateway: SocketGateway);
    create(data: {
        senderId: number;
        receiverId: number;
        type: string;
        title: string;
        message: string;
    }): Promise<Notification>;
    getUnreadCount(userId: number): Promise<{
        count: number;
    }>;
    findAllByUserId(userId: number): Promise<{
        sender: {
            id: number;
            name: string;
            imageUrl: string;
        } | null;
        id: number;
        senderId: number;
        receiverId: number;
        type: string;
        title: string;
        message: string;
        isRead: boolean;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    markAsRead(id: number): Promise<Notification | null>;
    markAllAsRead(userId: number): Promise<{
        success: boolean;
    }>;
    deleteNotification(senderId: number, receiverId: number, type: string): Promise<void>;
}
