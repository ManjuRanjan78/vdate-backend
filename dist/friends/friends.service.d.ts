import { Repository } from 'typeorm';
import { Friend, FriendStatus } from './entities/friend.entity';
import { Friendship } from './entities/friendship.entity';
import { User } from '../users/users.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { ChatService } from '../chat/chat.service';
export declare class FriendsService {
    private readonly friendRepo;
    private readonly userRepo;
    private readonly friendshipRepo;
    private readonly notificationsService;
    private readonly chatService;
    constructor(friendRepo: Repository<Friend>, userRepo: Repository<User>, friendshipRepo: Repository<Friendship>, notificationsService: NotificationsService, chatService: ChatService);
    sendFriendRequest(senderId: number, receiverId: number): Promise<{
        success: boolean;
        data: Friend;
        message: string;
    }>;
    private getCanonicalFriendPair;
    private areUsersAlreadyFriends;
    private ensureFriendshipExists;
    private finalizeFriendRequestAcceptance;
    sendOrAcceptFriendRequest(senderId: number, receiverId: number): Promise<{
        request: {
            success: boolean;
            data: Friend;
            message: string;
        };
        mutual: boolean;
    }>;
    acceptFriendRequest(requestId: number): Promise<Friend>;
    private notifyFriendRequestRejected;
    rejectFriendRequest(requestId: number): Promise<Friend>;
    rejectFriendRequestByUsers(rejectorId: number, requesterId: number): Promise<Friend>;
    acceptFriendRequestByUsers(acceptorId: number, requesterId: number): Promise<Friend>;
    getReverseRequestStatus(userId1: number, userId2: number): Promise<{
        exists: boolean;
        status?: FriendStatus;
    }>;
    getFriends(userId: number): Promise<User[]>;
    getMutualFriends(userId: number): Promise<User[]>;
    getPendingRequests(userId: number): Promise<{
        id: number;
        senderId: number;
        receiverId: number;
        status: FriendStatus;
        createdAt: Date;
        sender: {
            id: number;
            name: string;
            imageUrl: string;
        } | null;
    }[]>;
    getFriendStatus(userId: number, otherUserId: number): Promise<{
        status: string;
        areFriends: boolean;
        pendingRequestId?: undefined;
    } | {
        status: string;
        areFriends: boolean;
        pendingRequestId: number;
    }>;
}
