import { FriendsService } from './friends.service';
export declare class FriendsController {
    private readonly friendsService;
    constructor(friendsService: FriendsService);
    sendFriendRequest(req: any, body: {
        senderId?: number;
        receiverId: number;
    }): Promise<{
        success: boolean;
        data: import("./entities/friend.entity").Friend;
        message: string;
    }>;
    acceptFriendRequest(body: {
        requestId: number;
    }): Promise<import("./entities/friend.entity").Friend>;
    rejectFriendRequest(body: {
        requestId: number;
    }): Promise<import("./entities/friend.entity").Friend>;
    acceptFriendRequestByUsers(body: {
        acceptorId: number;
        requesterId: number;
    }): Promise<import("./entities/friend.entity").Friend>;
    rejectFriendRequestByUsers(body: {
        rejectorId: number;
        requesterId: number;
    }): Promise<import("./entities/friend.entity").Friend>;
    getMutualFriends(req: any): Promise<import("../users/users.entity").User[]>;
    getFriends(userId: string): Promise<import("../users/users.entity").User[]>;
    getPendingRequests(userId: string): Promise<{
        id: number;
        senderId: number;
        receiverId: number;
        status: import("./entities/friend.entity").FriendStatus;
        createdAt: Date;
        sender: {
            id: number;
            name: string;
            imageUrl: string;
        } | null;
    }[]>;
    getFriendStatus(userId: string, otherUserId: string): Promise<{
        status: string;
        areFriends: boolean;
        pendingRequestId?: undefined;
    } | {
        status: string;
        areFriends: boolean;
        pendingRequestId: number;
    }>;
}
