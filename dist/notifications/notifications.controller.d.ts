import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    getUserNotifications(userId: string): Promise<{
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
    getUnreadCount(userId: string): Promise<{
        count: number;
    }>;
    markAsRead(id: string): Promise<import("./entities/notification.entity").Notification | null>;
    markAllAsRead(userId: string): Promise<{
        success: boolean;
    }>;
}
