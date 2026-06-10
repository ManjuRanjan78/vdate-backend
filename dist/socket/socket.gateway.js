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
exports.SocketGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const redis_service_1 = require("../redis/redis.service");
const users_service_1 = require("../users/users.service");
const matches_service_1 = require("../matches/matches.service");
const chat_service_1 = require("../chat/chat.service");
const friends_service_1 = require("../friends/friends.service");
const calls_service_1 = require("../calls/calls.service");
const livekit_service_1 = require("../livekit/livekit.service");
const firebase_service_1 = require("../firebase/firebase.service");
let SocketGateway = class SocketGateway {
    redisService;
    usersService;
    matchService;
    friendsService;
    callsService;
    livekitService;
    firebaseService;
    chatService;
    server;
    activeCallTimers = new Map();
    PREDEFINED_MESSAGES = [
        'Hello!',
        'Hi',
        'How are you?',
        'Nice to meet you!',
        'Smile!',
        'Wow!',
        'You look great!'
    ];
    constructor(redisService, usersService, matchService, friendsService, callsService, livekitService, firebaseService, chatService) {
        this.redisService = redisService;
        this.usersService = usersService;
        this.matchService = matchService;
        this.friendsService = friendsService;
        this.callsService = callsService;
        this.livekitService = livekitService;
        this.firebaseService = firebaseService;
        this.chatService = chatService;
    }
    async sendFriendRequestPush(toUserId, fromUserId) {
        try {
            const receiver = await this.usersService.findById(toUserId);
            const sender = await this.usersService.findById(fromUserId);
            if (!receiver?.fcmToken) {
                return;
            }
            const senderName = sender?.name || 'Someone';
            await this.firebaseService.sendNotification(receiver.fcmToken, 'New friend request', `${senderName} sent you a friend request`, {
                type: 'friend_request',
                fromUserId: String(fromUserId),
            });
        }
        catch (error) {
            console.error('Friend request push error:', error);
        }
    }
    async sendFriendAcceptedPush(toUserId, fromUserId) {
        try {
            const receiver = await this.usersService.findById(toUserId);
            const accepter = await this.usersService.findById(fromUserId);
            if (!receiver?.fcmToken) {
                return;
            }
            const accepterName = accepter?.name || 'Someone';
            await this.firebaseService.sendNotification(receiver.fcmToken, 'Friend request accepted', `${accepterName} accepted your friend request`, {
                type: 'friend_request_accepted',
                fromUserId: String(fromUserId),
            });
        }
        catch (error) {
            console.error('Friend accepted push error:', error);
        }
    }
    async sendFriendRejectedPush(toUserId, fromUserId) {
        try {
            const receiver = await this.usersService.findById(toUserId);
            const rejector = await this.usersService.findById(fromUserId);
            if (!receiver?.fcmToken) {
                return;
            }
            const rejectorName = rejector?.name || 'Someone';
            await this.firebaseService.sendNotification(receiver.fcmToken, 'Friend request declined', `${rejectorName} declined your friend request`, {
                type: 'friend_request_rejected',
                fromUserId: String(fromUserId),
            });
        }
        catch (error) {
            console.error('Friend rejected push error:', error);
        }
    }
    async sendConversationUpdate(userId) {
        try {
            const conversations = await this.chatService.getChatRooms(userId);
            this.server.to(`chat_user_${userId}`).emit('conversation_updated', conversations);
        }
        catch (error) {
            console.error('Send conversation update error:', error);
        }
    }
    async sendBadgeUpdate(userId) {
        try {
            const unreadCount = await this.chatService.getUnreadBadgeCount(userId);
            this.server.to(`chat_user_${userId}`).emit('chat_badge_updated', { unreadCount });
        }
        catch (error) {
            console.error('Send badge update error:', error);
        }
    }
    async handleConnection(client) {
        try {
            const userId = client.handshake.query.userId;
            if (!userId) {
                client.disconnect();
                return;
            }
            client.join(`user_${userId}`);
            client.join(`chat_user_${userId}`);
            console.log(`JOINED ROOM: user_${userId} and chat_user_${userId}`);
            const user = await this.usersService.findById(userId);
            if (!user) {
                client.disconnect();
                return;
            }
            const oldSocketId = await this.redisService.get(`socket:${userId}`);
            if (oldSocketId &&
                oldSocketId !== client.id) {
                const oldSocket = this.server.sockets.sockets.get(oldSocketId);
                if (oldSocket &&
                    oldSocket.connected &&
                    oldSocket.id !== client.id) {
                    console.log(`Disconnecting old socket: ${oldSocket.id}`);
                    oldSocket.disconnect(true);
                }
            }
            await this.redisService.set(`socket:${userId}`, client.id, 86400);
            await this.usersService.setUserOnline(userId);
            console.log(` User Online: ${userId}`);
            client.emit('connected', {
                success: true,
                userId,
            });
        }
        catch (error) {
            console.log('Socket Connection Error:', error);
        }
    }
    async handleDisconnect(client) {
        try {
            const userId = client.handshake.query.userId;
            console.log('Socket Disconnected:', userId);
            if (!userId)
                return;
            const user = await this.usersService.findById(userId);
            if (!user)
                return;
            setTimeout(async () => {
                try {
                    const socketStillExists = await this.redisService.get(`socket:${userId}`);
                    if (socketStillExists &&
                        socketStillExists !== client.id) {
                        const activeSocket = this.server.sockets.sockets.get(socketStillExists);
                        if (activeSocket) {
                            console.log(`User reconnected before cleanup: ${userId}`);
                            return;
                        }
                    }
                    await this.redisService.del(`socket:${userId}`);
                    await this.usersService.setUserOffline(userId);
                    await this.redisService.removeBusy(userId);
                    await this.redisService.clearMatched(userId);
                    await this.matchService.removeFromQueue(userId, user.gender);
                    console.log(`User offline after timeout: ${userId}`);
                    if (user.isLive) {
                        console.log(`Broadcaster ${userId} offline. Ending live stream.`);
                        await this.usersService.updateUser(userId, {
                            isLive: false,
                            viewerCount: 0,
                            liveStartedAt: null,
                            liveLikes: 0,
                            liveCoins: 0,
                        });
                        this.server.to(`live_${userId}`).emit('live_ended', { hostId: userId });
                        this.server.emit('live_rooms_updated');
                    }
                    if (client.liveHostId) {
                        const hostId = client.liveHostId;
                        const host = await this.usersService.findById(hostId);
                        if (host) {
                            const newCount = Math.max(0, (host.viewerCount || 1) - 1);
                            await this.usersService.updateUser(hostId, { viewerCount: newCount });
                            this.server.to(`live_${hostId}`).emit('viewer_left', {
                                viewerCount: newCount,
                                userId,
                            });
                        }
                    }
                }
                catch (e) {
                    console.log('Delayed disconnect cleanup error:', e);
                }
            }, 10000);
            for (const [channel, timer] of this.activeCallTimers.entries()) {
                if (channel.includes(`_${userId}_`) || channel.endsWith(`_${userId}`)) {
                    const stillConnected = await this.redisService.get(`socket:${userId}`);
                    if (stillConnected) {
                        const activeSocket = this.server.sockets.sockets.get(stillConnected);
                        if (activeSocket) {
                            continue;
                        }
                    }
                    clearInterval(timer);
                    this.activeCallTimers.delete(channel);
                    const parts = channel
                        .replace('room_', '')
                        .split('_');
                    const otherUserId = parts[0] === userId ? parts[1] : parts[0];
                    await this.redisService.removeBusy(otherUserId);
                    await this.redisService.clearMatched(otherUserId);
                    this.server
                        .to(`user_${otherUserId}`)
                        .emit('call_ended', {
                        reason: 'User disconnected',
                    });
                }
            }
            console.log(`❌ User Offline: ${userId}`);
        }
        catch (error) {
            console.log('Socket Disconnect Error:', error);
        }
    }
    async handleMessage(client, data) {
        console.log('Message Received:', data);
        const isPredefined = data.isPredefined || (data.text && this.PREDEFINED_MESSAGES.includes(data.text));
        if (!isPredefined) {
            return {
                success: false,
                message: 'Only predefined messages are allowed',
            };
        }
        if (data.toUserId) {
            this.server
                .to(`user_${data.toUserId}`)
                .emit('message', {
                ...data,
                fromUserId: client.handshake.query.userId,
            });
        }
        return {
            success: true,
            message: 'Message received and forwarded',
            data,
        };
    }
    async handleAddFriend(client, data) {
        try {
            const fromUserId = Number(client.handshake.query.userId);
            const toUserId = Number(data.toUserId);
            if (!fromUserId || !toUserId)
                return { success: false, message: 'Invalid data' };
            await this.friendsService.sendFriendRequest(fromUserId, toUserId);
            await this.redisService.set(`friend_req:${fromUserId}:${toUserId}`, 'true');
            const sender = await this.usersService.findById(fromUserId);
            const senderName = sender?.name || 'Someone';
            const senderImage = sender?.imageUrl || '';
            this.server
                .to(`user_${toUserId}`)
                .emit('friend_request', {
                fromUserId,
            });
            const payload = {
                fromUserId,
                senderId: fromUserId,
                senderName,
                senderImage,
                receiverId: toUserId,
            };
            this.server
                .to(`user_${toUserId}`)
                .emit('friend_request_received', payload);
            this.server
                .to(`user_${toUserId}`)
                .emit('receive_friend_request', payload);
            await this.sendFriendRequestPush(toUserId, fromUserId);
            return {
                success: true,
                message: 'Friend request sent',
            };
        }
        catch (error) {
            console.log('Add Friend Error:', error);
            const message = error instanceof Error ? error.message : 'Failed to add friend';
            return { success: false, message };
        }
    }
    async handleSendFriendRequest(client, data) {
        try {
            const fromUserId = Number(data.from || client.handshake.query.userId);
            const toUserId = Number(data.to);
            if (!fromUserId || !toUserId) {
                return {
                    success: false,
                    message: 'Invalid data',
                };
            }
            const sender = await this.usersService.findById(fromUserId);
            this.server.to('user_' + toUserId).emit('friend_request', {
                fromUserId,
            });
            const requestPayload = {
                fromUserId,
                senderId: fromUserId,
                senderName: sender?.name || 'Someone',
                senderImage: sender?.imageUrl || '',
                receiverId: toUserId,
            };
            this.server.to('user_' + toUserId).emit('friend_request_received', requestPayload);
            this.server.to('user_' + toUserId).emit('receive_friend_request', requestPayload);
            await this.sendFriendRequestPush(toUserId, fromUserId);
            return {
                success: true,
                message: 'Friend request notification sent',
            };
        }
        catch (error) {
            console.log('Send Friend Request Error:', error);
            return {
                success: false,
                message: 'Failed to notify user',
            };
        }
    }
    async handleAcceptFriendRequest(client, data) {
        try {
            const acceptorId = Number(client.handshake.query.userId);
            const requesterId = Number(data.to);
            if (!acceptorId || !requesterId) {
                return {
                    success: false,
                    message: 'Invalid data',
                };
            }
            await this.friendsService.acceptFriendRequestByUsers(acceptorId, requesterId);
            try {
                await this.chatService.getOrCreateChatRoom(requesterId, acceptorId);
            }
            catch (err) {
                console.log('Create chat room on accept friend error:', err);
            }
            const acceptor = await this.usersService.findById(acceptorId);
            const requester = await this.usersService.findById(requesterId);
            const acceptorName = acceptor?.name || 'Someone';
            const requesterName = requester?.name || 'Someone';
            const acceptedPayloadForRequester = {
                fromUserId: acceptorId,
                senderId: acceptorId,
                receiverId: requesterId,
                otherUserId: acceptorId,
                isMutual: true,
                message: `${acceptorName} accepted your friend request. You are now friends!`,
            };
            const acceptedPayloadForAcceptor = {
                fromUserId: acceptorId,
                senderId: acceptorId,
                receiverId: acceptorId,
                otherUserId: requesterId,
                isMutual: true,
                message: `You are now friends with ${requesterName}.`,
            };
            this.server.to('user_' + requesterId).emit('friend_request_accepted', acceptedPayloadForRequester);
            this.server.to('user_' + acceptorId).emit('friend_request_accepted', acceptedPayloadForAcceptor);
            try {
                await this.sendConversationUpdate(requesterId);
                await this.sendConversationUpdate(acceptorId);
                await this.sendBadgeUpdate(requesterId);
                await this.sendBadgeUpdate(acceptorId);
            }
            catch (updateError) {
                console.log('Conversation update error after friend accept:', updateError);
            }
            await this.sendFriendAcceptedPush(requesterId, acceptorId);
            return {
                success: true,
                message: 'Friend request accepted notification sent',
            };
        }
        catch (error) {
            console.log('Accept Friend Request Error:', error);
            return {
                success: false,
                message: 'Failed to notify acceptance',
            };
        }
    }
    async handleRejectFriendRequest(client, data) {
        try {
            const fromUserId = Number(data.from || client.handshake.query.userId);
            const toUserId = Number(data.to);
            if (!fromUserId || !toUserId) {
                return {
                    success: false,
                    message: 'Invalid data',
                };
            }
            try {
                await this.friendsService.rejectFriendRequestByUsers(fromUserId, toUserId);
            }
            catch (error) {
                console.log('Reject Friend Request DB error:', error);
            }
            const rejector = await this.usersService.findById(fromUserId);
            const rejectorName = rejector?.name || 'Someone';
            this.server.to('user_' + toUserId).emit('friend_request_rejected', {
                fromUserId,
                receiverId: toUserId,
                message: `${rejectorName} declined your friend request.`,
            });
            await this.sendFriendRejectedPush(toUserId, fromUserId);
            return {
                success: true,
                message: 'Friend request rejection notification sent',
            };
        }
        catch (error) {
            console.log('Reject Friend Request Error:', error);
            return {
                success: false,
                message: 'Failed to notify rejection',
            };
        }
    }
    async handleGoOnlineCalls(client) {
        try {
            const userId = client.handshake.query.userId;
            if (!userId)
                return { success: false, message: 'User ID missing' };
            await this.usersService.setUserOnlineForCalls(userId);
            return { success: true };
        }
        catch (error) {
            console.error('go_online_calls error:', error);
            return { success: false, message: 'Failed to go online for calls' };
        }
    }
    async handleGoOfflineCalls(client) {
        try {
            const userId = client.handshake.query.userId;
            if (!userId)
                return { success: false, message: 'User ID missing' };
            await this.usersService.setUserOfflineForCalls(userId);
            return { success: true };
        }
        catch (error) {
            console.error('go_offline_calls error:', error);
            return { success: false, message: 'Failed to go offline for calls' };
        }
    }
    async findMatch(client, data) {
        let userId = '';
        let matchedUserId = null;
        try {
            userId =
                String(client.handshake.query.userId);
            console.log(`Searching user: ${userId}`);
            const currentUser = await this.usersService.findById(userId);
            if (!currentUser) {
                client.emit('match_error', {
                    success: false,
                    message: 'User not found',
                });
                return;
            }
            const gender = currentUser.gender
                ?.toLowerCase()
                .trim();
            if (!gender) {
                client.emit('match_error', {
                    success: false,
                    message: 'Gender missing',
                });
                return;
            }
            const isBusy = await this.redisService.get(`busy:${userId}`);
            if (isBusy) {
                client.emit('match_error', {
                    success: false,
                    message: 'User already busy',
                });
                return;
            }
            await this.matchService.removeFromQueue(userId, gender);
            await this.redisService.del(`queue:${userId}`);
            const preferenceGender = data?.preferenceGender || '';
            const preferenceLocation = data?.preferenceLocation || '';
            matchedUserId =
                await this.matchService.getMatch(userId, gender, preferenceGender, preferenceLocation);
            console.log(`Matched User Result: ${matchedUserId}`);
            if (!matchedUserId ||
                matchedUserId === userId) {
                console.log(`No match found for ${userId}, adding to queue`);
                await this.matchService.addToQueue(userId, gender);
                await this.redisService.set(`queue:${userId}`, 'true', 120);
                client.emit('waiting', {
                    success: true,
                    message: 'Searching users...',
                });
                return;
            }
            const matchedUser = await this.usersService.findById(matchedUserId);
            if (!matchedUser) {
                console.log(`Matched user missing: ${matchedUserId}`);
                await this.redisService.del(`socket:${matchedUserId}`);
                await this.redisService.del(`queue:${matchedUserId}`);
                await this.matchService.removeFromQueue(matchedUserId, 'male');
                await this.matchService.removeFromQueue(matchedUserId, 'female');
                await this.redisService.clearMatched(matchedUserId);
                await this.usersService.setUserOffline(matchedUserId);
                await this.clearMatchingLocks(userId, matchedUserId);
                return this.findMatch(client, data);
            }
            const matchedSocketId = await this.redisService.get(`socket:${matchedUserId}`);
            console.log(`MATCH FOUND ${userId} ↔ ${matchedUserId}`);
            console.log(`Receiver socket: ${matchedSocketId}`);
            const receiverSocket = matchedSocketId ? this.server.sockets.sockets.get(matchedSocketId) : null;
            if (!matchedSocketId || !receiverSocket || !receiverSocket.connected) {
                console.log(`Matched user socket missing or dead: ${matchedUserId}`);
                await this.redisService.del(`socket:${matchedUserId}`);
                await this.redisService.del(`queue:${matchedUserId}`);
                await this.matchService.removeFromQueue(matchedUserId, 'male');
                await this.matchService.removeFromQueue(matchedUserId, 'female');
                await this.redisService.clearMatched(matchedUserId);
                await this.usersService.setUserOffline(matchedUserId);
                await this.clearMatchingLocks(userId, matchedUserId);
                return this.findMatch(client, data);
            }
            await this.matchService.removeFromQueue(userId, gender);
            await this.matchService.removeFromQueue(matchedUserId, matchedUser.gender);
            await this.redisService.del(`queue:${userId}`);
            await this.redisService.del(`queue:${matchedUserId}`);
            await this.clearMatchingLocks(userId, matchedUserId);
            await this.redisService.setMatched(userId, matchedUserId);
            await this.redisService.setMatched(matchedUserId, userId);
            await this.redisService.setBusy(userId);
            await this.redisService.setBusy(matchedUserId);
            const sortedIds = [userId, matchedUserId].sort();
            const roomName = `room_${sortedIds[0]}_${sortedIds[1]}`;
            const callerToken = await this.livekitService.createToken(userId, roomName);
            const receiverToken = await this.livekitService.createToken(matchedUserId, roomName);
            const callResponse = await this.callsService.startVideoCall(userId, matchedUserId);
            const callId = callResponse?.callId ??
                `call_${Date.now()}`;
            const safeMatchedUser = {
                id: matchedUser.id,
                name: matchedUser.name,
                image: matchedUser.imageUrl,
                gender: matchedUser.gender,
            };
            const safeCurrentUser = {
                id: currentUser.id,
                name: currentUser.name,
                image: currentUser.imageUrl,
                gender: currentUser.gender,
            };
            const callerPayload = {
                success: true,
                role: 'caller',
                playRingtone: false,
                callId,
                matchedUserId,
                matchedUser: safeMatchedUser,
                roomName,
                token: callerToken,
                livekitUrl: process.env.LIVEKIT_URL,
            };
            const receiverPayload = {
                success: true,
                role: 'receiver',
                playRingtone: true,
                callId,
                matchedUserId: userId,
                matchedUser: safeCurrentUser,
                roomName,
                token: receiverToken,
                livekitUrl: process.env.LIVEKIT_URL,
            };
            await Promise.all([
                new Promise((resolve) => {
                    client.emit('match_found', callerPayload);
                    resolve(true);
                }),
                new Promise((resolve) => {
                    receiverSocket.emit('match_found', receiverPayload);
                    resolve(true);
                }),
            ]);
            console.log(`MATCH CREATED: ${userId} ↔ ${matchedUserId}`);
        }
        catch (error) {
            console.log('Find Match Error:', error);
            await this.clearMatchingLocks(userId, matchedUserId);
            try {
                if (userId) {
                    await this.redisService.removeBusy(userId);
                    await this.redisService.clearMatched(userId);
                }
                if (matchedUserId) {
                    await this.redisService.removeBusy(matchedUserId);
                    await this.redisService.clearMatched(matchedUserId);
                }
            }
            catch (cleanupError) {
                console.log('Cleanup Error:', cleanupError);
            }
            client.emit('match_error', {
                success: false,
                message: 'Failed to find match: ' + (error instanceof Error ? error.message : String(error)),
            });
        }
    }
    async startDirectCall(client, data) {
        let userId = '';
        let matchedUserId = null;
        try {
            userId = String(client.handshake.query.userId);
            matchedUserId = String(data.receiverId);
            console.log(`Direct Call Request from ${userId} to ${matchedUserId}`);
            const currentUser = await this.usersService.findById(userId);
            const matchedUser = await this.usersService.findById(matchedUserId);
            if (!currentUser || !matchedUser) {
                client.emit('match_error', { success: false, message: 'User not found' });
                return;
            }
            const matchedSocketId = await this.redisService.get(`socket:${matchedUserId}`);
            if (!matchedSocketId) {
                client.emit('match_error', { success: false, message: 'User is offline' });
                return;
            }
            const receiverSocket = this.server.sockets.sockets.get(matchedSocketId);
            if (!receiverSocket || !receiverSocket.connected) {
                client.emit('match_error', { success: false, message: 'User is offline' });
                return;
            }
            const receiverBusy = await this.redisService.isBusy(matchedUserId);
            if (receiverBusy) {
                client.emit('match_error', { success: false, message: 'User is in another call' });
                return;
            }
            const callerBusy = await this.redisService.isBusy(userId);
            if (callerBusy) {
                client.emit('match_error', { success: false, message: 'You are already in another call' });
                return;
            }
            await this.redisService.setMatched(userId, matchedUserId);
            await this.redisService.setMatched(matchedUserId, userId);
            await this.redisService.setBusy(userId);
            await this.redisService.setBusy(matchedUserId);
            const sortedIds = [userId, matchedUserId].sort();
            const roomName = `room_${sortedIds[0]}_${sortedIds[1]}`;
            const callerToken = await this.livekitService.createToken(userId, roomName);
            const receiverToken = await this.livekitService.createToken(matchedUserId, roomName);
            const callResponse = await this.callsService.startVideoCall(userId, matchedUserId);
            const callId = callResponse?.callId ?? `call_${Date.now()}`;
            const safeMatchedUser = {
                id: matchedUser.id,
                name: matchedUser.name,
                image: matchedUser.imageUrl,
                gender: matchedUser.gender,
            };
            const safeCurrentUser = {
                id: currentUser.id,
                name: currentUser.name,
                image: currentUser.imageUrl,
                gender: currentUser.gender,
            };
            const callerPayload = {
                success: true,
                role: 'caller',
                playRingtone: false,
                callId,
                matchedUserId,
                matchedUser: safeMatchedUser,
                roomName,
                token: callerToken,
                livekitUrl: process.env.LIVEKIT_URL,
            };
            const receiverPayload = {
                success: true,
                role: 'receiver',
                playRingtone: true,
                callId,
                matchedUserId: userId,
                matchedUser: safeCurrentUser,
                roomName,
                token: receiverToken,
                livekitUrl: process.env.LIVEKIT_URL,
            };
            client.emit('match_found', callerPayload);
            receiverSocket.emit('match_found', receiverPayload);
            console.log(`Direct Call established: ${userId} ↔ ${matchedUserId}`);
        }
        catch (error) {
            console.log('Direct Call error:', error);
            if (userId) {
                await this.redisService.removeBusy(userId);
                await this.redisService.clearMatched(userId);
            }
            if (matchedUserId) {
                await this.redisService.removeBusy(matchedUserId);
                await this.redisService.clearMatched(matchedUserId);
            }
            client.emit('match_error', { success: false, message: 'Failed to start direct call' });
        }
    }
    async clearMatchingLocks(userId, matchedUserId) {
        if (!userId || !matchedUserId) {
            return;
        }
        await this.redisService.del(`matching:${userId}`);
        await this.redisService.del(`matching:${matchedUserId}`);
    }
    async handleUserOnline(client, data) {
        try {
            const { userId, } = data;
            if (!userId) {
                return;
            }
            await this.redisService.set(`socket:${userId}`, client.id, 86400);
            console.log(`User socket updated: ${userId} -> ${client.id}`);
        }
        catch (error) {
            console.log('User Online Error:', error);
        }
    }
    async handleCallConnected(data) {
        try {
            const { roomName, userId, matchedUserId, } = data;
            if (this.activeCallTimers.has(roomName)) {
                return;
            }
            console.log(`CALL CONNECTED: ${roomName}`);
            this.startCoinDeduction(roomName, userId, matchedUserId);
        }
        catch (e) {
            console.log('Call Connected Error:', e);
        }
    }
    async handleAcceptCall(client, data) {
        try {
            const { matchedUserId } = data;
            this.server.to(`user_${matchedUserId}`).emit('accept_call', data);
            console.log(`Forwarded accept_call to user_${matchedUserId}`);
        }
        catch (e) {
            console.log('Error forwarding accept_call:', e);
        }
    }
    async leaveCall(data) {
        try {
            const { userId, matchedUserId } = data;
            await this.redisService.removeBusy(userId);
            await this.redisService.removeBusy(matchedUserId);
            await this.redisService.clearMatched(userId);
            await this.redisService.clearMatched(matchedUserId);
            await this.redisService.del(`queue:${userId}`);
            await this.redisService.del(`queue:${matchedUserId}`);
            this.server
                .to(`user_${matchedUserId}`)
                .emit('call_ended', {
                reason: 'User left the call',
            });
            const sortedIds = [userId, matchedUserId].sort();
            const roomName = `room_${sortedIds[0]}_${sortedIds[1]}`;
            console.log('=========================');
            console.log(`ROOM CREATED: ${roomName}`);
            console.log({
                caller: userId,
                receiver: matchedUserId,
            });
            console.log('=========================');
            if (this.activeCallTimers.has(roomName)) {
                clearInterval(this.activeCallTimers.get(roomName));
                this.activeCallTimers.delete(roomName);
            }
            console.log(`Call Ended: ${userId} ↔ ${matchedUserId}`);
        }
        catch (error) {
            console.log('Leave Call Error:', error);
        }
    }
    startCoinDeduction(channelName, userId1, userId2) {
        const deduct = async () => {
            try {
                const u1 = await this.usersService.findById(userId1);
                const u2 = await this.usersService.findById(userId2);
                let u1Coins = u1?.coins || 0;
                let u2Coins = u2?.coins || 0;
                if (u1Coins < 25 || u2Coins < 25) {
                    await this.endCallDueToCoins(channelName, userId1, userId2);
                    return;
                }
                await this.usersService.updateCoins(userId1, -25);
                await this.usersService.updateCoins(userId2, -25);
            }
            catch (e) {
                console.error('Coin deduction error:', e);
            }
        };
        deduct();
        const interval = setInterval(deduct, 20000);
        this.activeCallTimers.set(channelName, interval);
    }
    async endCallDueToCoins(channelName, userId1, userId2) {
        const timer = this.activeCallTimers.get(channelName);
        if (timer) {
            clearInterval(timer);
            this.activeCallTimers.delete(channelName);
        }
        await this.redisService.removeBusy(userId1);
        await this.redisService.removeBusy(userId2);
        await this.redisService.clearMatched(userId1);
        await this.redisService.clearMatched(userId2);
        this.server
            .to(`user_${userId1}`)
            .emit('call_ended', {
            reason: 'Insufficient coins',
        });
        this.server
            .to(`user_${userId2}`)
            .emit('call_ended', {
            reason: 'Insufficient coins',
        });
    }
    async handleLeaveQueue(data) {
        try {
            const { userId, } = data;
            if (!userId) {
                return;
            }
            const user = await this.usersService.findById(userId);
            if (!user) {
                return;
            }
            await this.matchService.removeFromQueue(userId, user.gender);
            await this.redisService.del(`queue:${userId}`);
            console.log(`User removed from queue: ${userId}`);
        }
        catch (error) {
            console.log('Leave Queue Error:', error);
        }
    }
    async handleHostStartLive(client, data) {
        try {
            const hostId = data.hostId || client.handshake.query.userId;
            console.log(`Host starting live stream: ${hostId}`);
            await this.usersService.updateUser(hostId, {
                isLive: true,
                viewerCount: 0,
                liveStartedAt: new Date(),
                liveLikes: 0,
                liveCoins: 0,
            });
            client.join(`live_${hostId}`);
            const roomName = `live_${hostId}`;
            const token = await this.livekitService.createToken(hostId, roomName);
            this.server.emit('live_rooms_updated');
            return {
                success: true,
                roomName,
                token,
                livekitUrl: process.env.LIVEKIT_URL,
            };
        }
        catch (e) {
            console.error('Host start live error:', e);
            return { success: false, message: e.message };
        }
    }
    async handleHostStopLive(client, data) {
        try {
            const hostId = data.hostId || client.handshake.query.userId;
            console.log(`Host stopping live stream: ${hostId}`);
            await this.usersService.updateUser(hostId, {
                isLive: false,
                viewerCount: 0,
                liveStartedAt: null,
                liveLikes: 0,
                liveCoins: 0,
            });
            const roomName = `live_${hostId}`;
            this.server.to(roomName).emit('live_ended', { hostId });
            const roomSockets = await this.server.in(roomName).fetchSockets();
            for (const socket of roomSockets) {
                socket.liveHostId = null;
                socket.leave(roomName);
            }
            this.server.emit('live_rooms_updated');
            return { success: true };
        }
        catch (e) {
            console.error('Host stop live error:', e);
            return { success: false, message: e.message };
        }
    }
    async handleJoinLive(client, data) {
        try {
            const { hostId, userId } = data;
            console.log(`Viewer ${userId} joining live stream of ${hostId}`);
            const roomName = `live_${hostId}`;
            client.join(roomName);
            client.liveHostId = hostId;
            const host = await this.usersService.findById(hostId);
            let newCount = 1;
            if (host) {
                newCount = (host.viewerCount || 0) + 1;
                await this.usersService.updateUser(hostId, { viewerCount: newCount });
                const viewer = await this.usersService.findById(userId);
                this.server.to(roomName).emit('viewer_joined', {
                    viewerCount: newCount,
                    userId,
                    name: viewer?.name || 'Someone',
                    avatarUrl: viewer?.imageUrl || '',
                });
            }
            const token = await this.livekitService.createToken(userId, roomName);
            return {
                success: true,
                token,
                livekitUrl: process.env.LIVEKIT_URL,
                liveStartedAt: host?.liveStartedAt,
                liveLikes: host?.liveLikes || 0,
                liveCoins: host?.liveCoins || 0,
            };
        }
        catch (e) {
            console.error('Join live error:', e);
            return { success: false, message: e.message };
        }
    }
    async handleLeaveLive(client, data) {
        try {
            const { hostId, userId } = data;
            console.log(`Viewer ${userId} leaving live stream of ${hostId}`);
            const roomName = `live_${hostId}`;
            client.leave(roomName);
            client.liveHostId = null;
            const host = await this.usersService.findById(hostId);
            if (host) {
                const newCount = Math.max(0, (host.viewerCount || 1) - 1);
                await this.usersService.updateUser(hostId, { viewerCount: newCount });
                this.server.to(roomName).emit('viewer_left', {
                    viewerCount: newCount,
                    userId,
                });
            }
            return { success: true };
        }
        catch (e) {
            console.error('Leave live error:', e);
            return { success: false, message: e.message };
        }
    }
    async handleLiveComment(client, data) {
        try {
            const { hostId, userId, comment } = data;
            const roomName = `live_${hostId}`;
            const sender = await this.usersService.findById(userId);
            this.server.to(roomName).emit('live_comment_received', {
                userId,
                name: sender?.name || 'Someone',
                avatarUrl: sender?.imageUrl || '',
                comment,
            });
            return { success: true };
        }
        catch (e) {
            console.error('Live comment error:', e);
            return { success: false, message: e.message };
        }
    }
    async handleLiveLike(data) {
        try {
            const { hostId, userId } = data;
            const roomName = `live_${hostId}`;
            const host = await this.usersService.findById(hostId);
            if (host) {
                const newLikes = (host.liveLikes || 0) + 1;
                await this.usersService.updateUser(hostId, { liveLikes: newLikes });
            }
            this.server.to(roomName).emit('live_like_received', {
                userId,
            });
            return { success: true };
        }
        catch (e) {
            console.error('Live like error:', e);
            return { success: false, message: e.message };
        }
    }
    async handleLiveGift(client, data) {
        try {
            const { hostId, fromUserId, giftId, giftName, giftCoins } = data;
            const roomName = `live_${hostId}`;
            const sender = await this.usersService.findById(fromUserId);
            const receiver = await this.usersService.findById(hostId);
            if (!sender || !receiver) {
                return { success: false, message: 'User not found' };
            }
            if ((sender.coins || 0) < giftCoins) {
                return { success: false, message: 'Insufficient coins' };
            }
            const senderNewCoins = await this.usersService.updateCoins(fromUserId, -giftCoins);
            const receiverNewCoins = await this.usersService.updateCoins(hostId, giftCoins);
            const host = await this.usersService.findById(hostId);
            if (host) {
                const newLiveCoins = (host.liveCoins || 0) + giftCoins;
                await this.usersService.updateUser(hostId, { liveCoins: newLiveCoins });
            }
            this.server.to(roomName).emit('live_gift_received', {
                senderId: fromUserId,
                senderName: sender.name || 'Someone',
                giftId,
                giftName,
                giftCoins,
            });
            this.server.to(`user_${fromUserId}`).emit('balance_update', { coins: senderNewCoins });
            this.server.to(`user_${hostId}`).emit('balance_update', { coins: receiverNewCoins });
            return { success: true, newBalance: senderNewCoins };
        }
        catch (e) {
            console.error('Live gift error:', e);
            return { success: false, message: e.message };
        }
    }
};
exports.SocketGateway = SocketGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], SocketGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('message'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], SocketGateway.prototype, "handleMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('add_friend'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], SocketGateway.prototype, "handleAddFriend", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('send_friend_request'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], SocketGateway.prototype, "handleSendFriendRequest", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('accept_friend_request'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], SocketGateway.prototype, "handleAcceptFriendRequest", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('reject_friend_request'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], SocketGateway.prototype, "handleRejectFriendRequest", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('go_online_calls'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], SocketGateway.prototype, "handleGoOnlineCalls", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('go_offline_calls'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], SocketGateway.prototype, "handleGoOfflineCalls", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('find_match'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], SocketGateway.prototype, "findMatch", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('start_direct_call'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], SocketGateway.prototype, "startDirectCall", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('user_online'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], SocketGateway.prototype, "handleUserOnline", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('call_connected'),
    __param(0, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SocketGateway.prototype, "handleCallConnected", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('accept_call'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], SocketGateway.prototype, "handleAcceptCall", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leave_call'),
    __param(0, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SocketGateway.prototype, "leaveCall", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leave_queue'),
    __param(0, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SocketGateway.prototype, "handleLeaveQueue", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('host_start_live'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], SocketGateway.prototype, "handleHostStartLive", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('host_stop_live'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], SocketGateway.prototype, "handleHostStopLive", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('join_live'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], SocketGateway.prototype, "handleJoinLive", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leave_live'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], SocketGateway.prototype, "handleLeaveLive", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('live_comment'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], SocketGateway.prototype, "handleLiveComment", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('live_like'),
    __param(0, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SocketGateway.prototype, "handleLiveLike", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('live_gift'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], SocketGateway.prototype, "handleLiveGift", null);
exports.SocketGateway = SocketGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: [
                'http://localhost:3000',
                'http://192.168.0.4:3000',
                'http://192.168.0.4:8080',
                'https://yourdomain.com',
                /^http:\/\/192\.168\..*:\d+$/,
            ],
            credentials: true,
        },
    }),
    __param(3, (0, common_1.Inject)((0, common_1.forwardRef)(() => friends_service_1.FriendsService))),
    __metadata("design:paramtypes", [redis_service_1.RedisService,
        users_service_1.UsersService,
        matches_service_1.MatchService,
        friends_service_1.FriendsService,
        calls_service_1.CallsService,
        livekit_service_1.LivekitService,
        firebase_service_1.FirebaseService,
        chat_service_1.ChatService])
], SocketGateway);
//# sourceMappingURL=socket.gateway.js.map