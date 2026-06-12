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
exports.FriendsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const typeorm_2 = require("@nestjs/typeorm");
const typeorm_3 = require("typeorm");
const friend_entity_1 = require("./entities/friend.entity");
const friendship_entity_1 = require("./entities/friendship.entity");
const users_entity_1 = require("../users/users.entity");
const notifications_service_1 = require("../notifications/notifications.service");
const chat_service_1 = require("../chat/chat.service");
let FriendsService = class FriendsService {
    friendRepo;
    userRepo;
    friendshipRepo;
    notificationsService;
    chatService;
    constructor(friendRepo, userRepo, friendshipRepo, notificationsService, chatService) {
        this.friendRepo = friendRepo;
        this.userRepo = userRepo;
        this.friendshipRepo = friendshipRepo;
        this.notificationsService = notificationsService;
        this.chatService = chatService;
    }
    async sendFriendRequest(senderId, receiverId) {
        if (senderId === receiverId) {
            throw new common_1.BadRequestException('Cannot add yourself');
        }
        const sender = await this.userRepo.findOne({
            where: {
                id: senderId,
            },
        });
        if (!sender) {
            throw new common_1.BadRequestException('Sender not found');
        }
        const receiver = await this.userRepo.findOne({
            where: {
                id: receiverId,
            },
        });
        if (!receiver) {
            throw new common_1.BadRequestException('User not found');
        }
        const existingRequest = await this.friendRepo.findOne({
            where: {
                senderId,
                receiverId,
            },
        });
        if (existingRequest) {
            if (existingRequest.status ===
                friend_entity_1.FriendStatus.PENDING) {
                throw new common_1.BadRequestException('Friend request already sent.');
            }
            if (existingRequest.status ===
                friend_entity_1.FriendStatus.ACCEPTED) {
                throw new common_1.BadRequestException('You are already friends with this user.');
            }
        }
        const reverseRequest = await this.friendRepo.findOne({
            where: {
                senderId: receiverId,
                receiverId: senderId,
            },
        });
        if (reverseRequest) {
            if (reverseRequest.status ===
                friend_entity_1.FriendStatus.PENDING) {
                const acceptedRequest = await this.acceptFriendRequest(reverseRequest.id);
                return {
                    success: true,
                    data: acceptedRequest,
                    message: 'Friend request accepted. You are now friends!',
                };
            }
            if (reverseRequest.status ===
                friend_entity_1.FriendStatus.ACCEPTED) {
                throw new common_1.BadRequestException('You are already friends with this user.');
            }
        }
        if (await this.areUsersAlreadyFriends(senderId, receiverId)) {
            throw new common_1.BadRequestException('You are already friends with this user.');
        }
        const request = this.friendRepo.create({
            senderId,
            receiverId,
            status: friend_entity_1.FriendStatus.PENDING,
        });
        const savedRequest = await this.friendRepo.save(request);
        await this.notificationsService.create({
            senderId,
            receiverId,
            type: 'friend_request',
            title: 'New Friend Request',
            message: `${sender.name || 'Someone'} sent you a friend request`,
        });
        return {
            success: true,
            data: savedRequest,
            message: 'Friend request sent successfully',
        };
    }
    getCanonicalFriendPair(user1Id, user2Id) {
        const u1 = Number(user1Id);
        const u2 = Number(user2Id);
        return u1 < u2
            ? { user1Id: u1, user2Id: u2 }
            : { user1Id: u2, user2Id: u1 };
    }
    async areUsersAlreadyFriends(user1Id, user2Id) {
        const { user1Id: firstId, user2Id: secondId } = this.getCanonicalFriendPair(user1Id, user2Id);
        const friendship = await this.friendshipRepo.findOne({
            where: {
                user1Id: firstId,
                user2Id: secondId,
            },
        });
        if (friendship) {
            return true;
        }
        const existingAccepted = await this.friendRepo.findOne({
            where: [
                {
                    senderId: user1Id,
                    receiverId: user2Id,
                    status: friend_entity_1.FriendStatus.ACCEPTED,
                },
                {
                    senderId: user2Id,
                    receiverId: user1Id,
                    status: friend_entity_1.FriendStatus.ACCEPTED,
                },
            ],
        });
        return !!existingAccepted;
    }
    async ensureFriendshipExists(user1Id, user2Id) {
        const { user1Id: firstId, user2Id: secondId } = this.getCanonicalFriendPair(user1Id, user2Id);
        let friendship = await this.friendshipRepo.findOne({
            where: {
                user1Id: firstId,
                user2Id: secondId,
            },
        });
        if (!friendship) {
            friendship = this.friendshipRepo.create({
                user1Id: firstId,
                user2Id: secondId,
            });
            try {
                friendship = await this.friendshipRepo.save(friendship);
            }
            catch (error) {
                friendship = await this.friendshipRepo.findOne({
                    where: {
                        user1Id: firstId,
                        user2Id: secondId,
                    },
                });
                if (!friendship) {
                    throw error;
                }
            }
        }
        return friendship;
    }
    async finalizeFriendRequestAcceptance(request) {
        await this.notificationsService.deleteNotification(request.senderId, request.receiverId, 'friend_request');
        await this.ensureFriendshipExists(request.senderId, request.receiverId);
        try {
            await this.chatService.getOrCreateChatRoom(request.senderId, request.receiverId);
        }
        catch (error) {
            console.log('Chat room creation error during friend acceptance:', error);
        }
        const acceptor = await this.userRepo.findOne({
            where: { id: request.receiverId },
        });
        await this.notificationsService.create({
            senderId: request.receiverId,
            receiverId: request.senderId,
            type: 'friend_request_accepted',
            title: 'Friend Request Accepted',
            message: `${acceptor?.name || 'Someone'} accepted your friend request. You are now friends!`,
        });
        return request;
    }
    async sendOrAcceptFriendRequest(senderId, receiverId) {
        const request = await this.sendFriendRequest(senderId, receiverId);
        return {
            request,
            mutual: false,
        };
    }
    async acceptFriendRequest(requestId) {
        const request = await this.friendRepo.findOne({
            where: {
                id: requestId,
            },
        });
        if (!request) {
            throw new common_1.BadRequestException('Request not found');
        }
        if (request.status ===
            friend_entity_1.FriendStatus.ACCEPTED) {
            await this.ensureFriendshipExists(request.senderId, request.receiverId);
            try {
                await this.chatService.getOrCreateChatRoom(request.senderId, request.receiverId);
            }
            catch (_) { }
            return request;
        }
        if (request.status !==
            friend_entity_1.FriendStatus.PENDING) {
            throw new common_1.BadRequestException('Request cannot be accepted');
        }
        request.status =
            friend_entity_1.FriendStatus.ACCEPTED;
        const savedRequest = await this.friendRepo.save(request);
        return this.finalizeFriendRequestAcceptance(savedRequest);
    }
    async notifyFriendRequestRejected(rejectorId, requesterId) {
        const rejector = await this.userRepo.findOne({
            where: { id: rejectorId },
        });
        await this.notificationsService.create({
            senderId: rejectorId,
            receiverId: requesterId,
            type: 'friend_request_rejected',
            title: 'Friend Request Declined',
            message: `${rejector?.name || 'Someone'} declined your friend request.`,
        });
    }
    async rejectFriendRequest(requestId) {
        const request = await this.friendRepo.findOne({
            where: {
                id: requestId,
            },
        });
        if (!request) {
            throw new common_1.BadRequestException('Request not found');
        }
        if (request.status !==
            friend_entity_1.FriendStatus.PENDING) {
            throw new common_1.BadRequestException('Request cannot be rejected');
        }
        request.status =
            friend_entity_1.FriendStatus.REJECTED;
        await this.notificationsService.deleteNotification(request.senderId, request.receiverId, 'friend_request');
        await this.notifyFriendRequestRejected(request.receiverId, request.senderId);
        return this.friendRepo.save(request);
    }
    async rejectFriendRequestByUsers(rejectorId, requesterId) {
        const request = await this.friendRepo.findOne({
            where: {
                senderId: requesterId,
                receiverId: rejectorId,
                status: friend_entity_1.FriendStatus.PENDING,
            },
        });
        if (!request) {
            throw new common_1.BadRequestException('Request not found');
        }
        request.status =
            friend_entity_1.FriendStatus.REJECTED;
        await this.notificationsService.deleteNotification(requesterId, rejectorId, 'friend_request');
        await this.notifyFriendRequestRejected(rejectorId, requesterId);
        return this.friendRepo.save(request);
    }
    async acceptFriendRequestByUsers(acceptorId, requesterId) {
        const request = await this.friendRepo.findOne({
            where: {
                senderId: requesterId,
                receiverId: acceptorId,
            },
        });
        if (!request) {
            throw new common_1.BadRequestException('Request not found');
        }
        if (request.status ===
            friend_entity_1.FriendStatus.ACCEPTED) {
            await this.ensureFriendshipExists(request.senderId, request.receiverId);
            try {
                await this.chatService.getOrCreateChatRoom(request.senderId, request.receiverId);
            }
            catch (_) { }
            return request;
        }
        if (request.status !==
            friend_entity_1.FriendStatus.PENDING) {
            throw new common_1.BadRequestException('Request cannot be accepted');
        }
        request.status =
            friend_entity_1.FriendStatus.ACCEPTED;
        const savedRequest = await this.friendRepo.save(request);
        return this.finalizeFriendRequestAcceptance(savedRequest);
    }
    async getReverseRequestStatus(userId1, userId2) {
        const reverseRequest = await this.friendRepo.findOne({
            where: {
                senderId: userId1,
                receiverId: userId2,
            },
        });
        if (!reverseRequest) {
            return { exists: false };
        }
        return {
            exists: true,
            status: reverseRequest.status,
        };
    }
    async getFriends(userId) {
        const friendIds = new Set();
        const uid = Number(userId);
        const friendships = await this.friendshipRepo.find({
            where: [
                { user1Id: uid },
                { user2Id: uid },
            ],
        });
        for (const friendship of friendships) {
            const u1 = Number(friendship.user1Id);
            const u2 = Number(friendship.user2Id);
            friendIds.add(u1 === uid ? u2 : u1);
        }
        const acceptedRequests = await this.friendRepo.find({
            where: [
                {
                    senderId: uid,
                    status: friend_entity_1.FriendStatus.ACCEPTED,
                },
                {
                    receiverId: uid,
                    status: friend_entity_1.FriendStatus.ACCEPTED,
                },
            ],
        });
        for (const request of acceptedRequests) {
            const sid = Number(request.senderId);
            const rid = Number(request.receiverId);
            friendIds.add(sid === uid ? rid : sid);
        }
        if (friendIds.size === 0) {
            return [];
        }
        return this.userRepo.find({
            where: {
                id: (0, typeorm_1.In)(Array.from(friendIds)),
            },
        });
    }
    async getMutualFriends(userId) {
        return this.getFriends(userId);
    }
    async getPendingRequests(userId) {
        const requests = await this.friendRepo.find({
            where: {
                receiverId: userId,
                status: friend_entity_1.FriendStatus.PENDING,
            },
            order: {
                createdAt: 'DESC',
            },
        });
        if (requests.length == 0) {
            return [];
        }
        const senderIds = requests.map((request) => request.senderId);
        const senders = await this.userRepo.findBy({
            id: (0, typeorm_1.In)(senderIds),
        });
        return requests.map((request) => {
            const sender = senders.find((user) => user.id === request.senderId);
            return {
                id: request.id,
                senderId: request.senderId,
                receiverId: request.receiverId,
                status: request.status,
                createdAt: request.createdAt,
                sender: sender == null
                    ? null
                    : {
                        id: sender.id,
                        name: sender.name || sender.email || 'Unknown',
                        imageUrl: sender.imageUrl || '',
                    },
            };
        });
    }
    async getFriendStatus(userId, otherUserId) {
        const areFriends = await this.areUsersAlreadyFriends(userId, otherUserId);
        if (areFriends) {
            return {
                status: 'friends',
                areFriends: true,
            };
        }
        const outgoingRequest = await this.friendRepo.findOne({
            where: {
                senderId: userId,
                receiverId: otherUserId,
                status: friend_entity_1.FriendStatus.PENDING,
            },
        });
        if (outgoingRequest) {
            return {
                status: 'sent',
                areFriends: false,
                pendingRequestId: outgoingRequest.id,
            };
        }
        const incomingRequest = await this.friendRepo.findOne({
            where: {
                senderId: otherUserId,
                receiverId: userId,
                status: friend_entity_1.FriendStatus.PENDING,
            },
        });
        if (incomingRequest) {
            return {
                status: 'received',
                areFriends: false,
                pendingRequestId: incomingRequest.id,
            };
        }
        return {
            status: 'none',
            areFriends: false,
        };
    }
};
exports.FriendsService = FriendsService;
exports.FriendsService = FriendsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_2.InjectRepository)(friend_entity_1.Friend)),
    __param(1, (0, typeorm_2.InjectRepository)(users_entity_1.User)),
    __param(2, (0, typeorm_2.InjectRepository)(friendship_entity_1.Friendship)),
    __param(4, (0, common_1.Inject)((0, common_1.forwardRef)(() => chat_service_1.ChatService))),
    __metadata("design:paramtypes", [typeorm_3.Repository,
        typeorm_3.Repository,
        typeorm_3.Repository,
        notifications_service_1.NotificationsService,
        chat_service_1.ChatService])
], FriendsService);
//# sourceMappingURL=friends.service.js.map