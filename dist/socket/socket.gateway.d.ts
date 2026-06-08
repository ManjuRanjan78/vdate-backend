import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RedisService } from '../redis/redis.service';
import { UsersService } from '../users/users.service';
import { MatchService } from '../matches/matches.service';
import { ChatService } from '../chat/chat.service';
import { FriendsService } from '../friends/friends.service';
import { CallsService } from '../calls/calls.service';
import { LivekitService } from '../livekit/livekit.service';
import { FirebaseService } from '../firebase/firebase.service';
export declare class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private redisService;
    private usersService;
    private readonly matchService;
    private readonly friendsService;
    private readonly callsService;
    private readonly livekitService;
    private readonly firebaseService;
    private readonly chatService;
    server: Server;
    private activeCallTimers;
    private readonly PREDEFINED_MESSAGES;
    constructor(redisService: RedisService, usersService: UsersService, matchService: MatchService, friendsService: FriendsService, callsService: CallsService, livekitService: LivekitService, firebaseService: FirebaseService, chatService: ChatService);
    private sendFriendRequestPush;
    private sendFriendAcceptedPush;
    private sendFriendRejectedPush;
    private sendConversationUpdate;
    private sendBadgeUpdate;
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): Promise<void>;
    handleMessage(client: Socket, data: any): Promise<{
        success: boolean;
        message: string;
        data?: undefined;
    } | {
        success: boolean;
        message: string;
        data: any;
    }>;
    handleAddFriend(client: Socket, data: any): Promise<{
        success: boolean;
        message: string;
    }>;
    handleSendFriendRequest(client: Socket, data: any): Promise<{
        success: boolean;
        message: string;
    }>;
    handleAcceptFriendRequest(client: Socket, data: any): Promise<{
        success: boolean;
        message: string;
    }>;
    handleRejectFriendRequest(client: Socket, data: any): Promise<{
        success: boolean;
        message: string;
    }>;
    handleGoOnlineCalls(client: Socket): Promise<{
        success: boolean;
        message: string;
    } | {
        success: boolean;
        message?: undefined;
    }>;
    handleGoOfflineCalls(client: Socket): Promise<{
        success: boolean;
        message: string;
    } | {
        success: boolean;
        message?: undefined;
    }>;
    findMatch(client: Socket, data: any): Promise<void>;
    startDirectCall(client: Socket, data: {
        receiverId: string;
    }): Promise<void>;
    private clearMatchingLocks;
    handleUserOnline(client: Socket, data: any): Promise<void>;
    handleCallConnected(data: any): Promise<void>;
    handleAcceptCall(client: Socket, data: any): Promise<void>;
    leaveCall(data: any): Promise<void>;
    private startCoinDeduction;
    private endCallDueToCoins;
    handleLeaveQueue(data: any): Promise<void>;
    handleHostStartLive(client: Socket, data: {
        hostId: string;
        title?: string;
        category?: string;
        coverUrl?: string;
    }): Promise<{
        success: boolean;
        roomName: string;
        token: string;
        livekitUrl: string | undefined;
        message?: undefined;
    } | {
        success: boolean;
        message: any;
        roomName?: undefined;
        token?: undefined;
        livekitUrl?: undefined;
    }>;
    handleHostStopLive(client: Socket, data: {
        hostId: string;
    }): Promise<{
        success: boolean;
        message?: undefined;
    } | {
        success: boolean;
        message: any;
    }>;
    handleJoinLive(client: Socket, data: {
        hostId: string;
        userId: string;
    }): Promise<{
        success: boolean;
        token: string;
        livekitUrl: string | undefined;
        message?: undefined;
    } | {
        success: boolean;
        message: any;
        token?: undefined;
        livekitUrl?: undefined;
    }>;
    handleLeaveLive(client: Socket, data: {
        hostId: string;
        userId: string;
    }): Promise<{
        success: boolean;
        message?: undefined;
    } | {
        success: boolean;
        message: any;
    }>;
    handleLiveComment(client: Socket, data: {
        hostId: string;
        userId: string;
        comment: string;
    }): Promise<{
        success: boolean;
        message?: undefined;
    } | {
        success: boolean;
        message: any;
    }>;
    handleLiveLike(data: {
        hostId: string;
        userId: string;
    }): Promise<{
        success: boolean;
        message?: undefined;
    } | {
        success: boolean;
        message: any;
    }>;
    handleLiveGift(client: Socket, data: {
        hostId: string;
        fromUserId: string;
        giftId: string;
        giftName: string;
        giftCoins: number;
    }): Promise<{
        success: boolean;
        newBalance: number;
        message?: undefined;
    } | {
        success: boolean;
        message: any;
        newBalance?: undefined;
    }>;
}
