import {
  Injectable,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { In } from 'typeorm';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import {
  Friend,
  FriendStatus,
} from './entities/friend.entity';
import { Friendship } from './entities/friendship.entity';

import { User } from '../users/users.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { ChatService } from '../chat/chat.service';

@Injectable()
export class FriendsService {
  constructor(
    @InjectRepository(Friend)
    private readonly friendRepo:
      Repository<Friend>,

    @InjectRepository(User)
    private readonly userRepo:
      Repository<User>,

    @InjectRepository(Friendship)
    private readonly friendshipRepo:
      Repository<Friendship>,

    private readonly notificationsService: NotificationsService,

    @Inject(forwardRef(() => ChatService))
    private readonly chatService: ChatService,
  ) {}

  // =========================
  // SEND FRIEND REQUEST
  // =========================

  async sendFriendRequest(
  senderId: number,
  receiverId: number,
) {

  // =========================
  // SELF CHECK
  // =========================

  if (senderId === receiverId) {

    throw new BadRequestException(
      'Cannot add yourself',
    );
  }

  // =========================
  // CHECK SENDER EXISTS
  // =========================

  const sender =
    await this.userRepo.findOne({
      where: {
        id: senderId,
      },
    });

  if (!sender) {

    throw new BadRequestException(
      'Sender not found',
    );
  }

  // =========================
  // CHECK RECEIVER EXISTS
  // =========================

  const receiver =
    await this.userRepo.findOne({
      where: {
        id: receiverId,
      },
    });

  if (!receiver) {

    throw new BadRequestException(
      'User not found',
    );
  }

  // =========================
  // CHECK EXISTING REQUEST IN SAME DIRECTION
  // =========================

  const existingRequest =
    await this.friendRepo.findOne({
      where: {
        senderId,
        receiverId,
      },
    });

  if (existingRequest) {
    if (
      existingRequest.status ===
      FriendStatus.PENDING
    ) {
      throw new BadRequestException(
        'Friend request already sent.',
      );
    }

    if (
      existingRequest.status ===
      FriendStatus.ACCEPTED
    ) {
      throw new BadRequestException(
        'You are already friends with this user.',
      );
    }
  }

  // =========================
  // CHECK REVERSE REQUEST
  // =========================
  const reverseRequest = await this.friendRepo.findOne({
    where: {
      senderId: receiverId,
      receiverId: senderId,
    },
  });

  if (reverseRequest) {
    if (
      reverseRequest.status ===
      FriendStatus.PENDING
    ) {
      const acceptedRequest = await this.acceptFriendRequest(
        reverseRequest.id,
      );
      return {
        success: true,
        data: acceptedRequest,
        message: 'Friend request accepted. You are now friends!',
      };
    }

    if (
      reverseRequest.status ===
      FriendStatus.ACCEPTED
    ) {
      throw new BadRequestException(
        'You are already friends with this user.',
      );
    }
  }

  if (await this.areUsersAlreadyFriends(senderId, receiverId)) {
    throw new BadRequestException(
      'You are already friends with this user.',
    );
  }

  // =========================
  // CREATE REQUEST
  // =========================

  const request =
    this.friendRepo.create({

      senderId,
      receiverId,

      status:
        FriendStatus.PENDING,
    });

  const savedRequest = await this.friendRepo.save(
    request,
  );

  // =========================
  // CREATE NOTIFICATION
  // =========================

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

  private getCanonicalFriendPair(user1Id: number, user2Id: number) {
    const u1 = Number(user1Id);
    const u2 = Number(user2Id);
    return u1 < u2
      ? { user1Id: u1, user2Id: u2 }
      : { user1Id: u2, user2Id: u1 };
  }

  private async areUsersAlreadyFriends(
    user1Id: number,
    user2Id: number,
  ) {
    const { user1Id: firstId, user2Id: secondId } = this.getCanonicalFriendPair(
      user1Id,
      user2Id,
    );

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
          status: FriendStatus.ACCEPTED,
        },
        {
          senderId: user2Id,
          receiverId: user1Id,
          status: FriendStatus.ACCEPTED,
        },
      ],
    });

    return !!existingAccepted;
  }

  private async ensureFriendshipExists(
    user1Id: number,
    user2Id: number,
  ) {
    const { user1Id: firstId, user2Id: secondId } = this.getCanonicalFriendPair(
      user1Id,
      user2Id,
    );

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
      } catch (error) {
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

  private async finalizeFriendRequestAcceptance(
    request: Friend,
  ) {
    await this.notificationsService.deleteNotification(
      request.senderId,
      request.receiverId,
      'friend_request',
    );

    await this.ensureFriendshipExists(
      request.senderId,
      request.receiverId,
    );

    try {
      await this.chatService.getOrCreateChatRoom(
        request.senderId,
        request.receiverId,
      );
    } catch (error) {
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

  async sendOrAcceptFriendRequest(
    senderId: number,
    receiverId: number,
  ) {
    const request = await this.sendFriendRequest(
      senderId,
      receiverId,
    );

    return {
      request,
      mutual: false,
    };
  }

  // =========================
  // ACCEPT FRIEND REQUEST
  // =========================

  async acceptFriendRequest(
    requestId: number,
  ) {
    const request = await this.friendRepo.findOne({
      where: {
        id: requestId,
      },
    });

    if (!request) {
      throw new BadRequestException(
        'Request not found',
      );
    }

    if (
      request.status ===
      FriendStatus.ACCEPTED
    ) {
      await this.ensureFriendshipExists(
        request.senderId,
        request.receiverId,
      );
      try {
        await this.chatService.getOrCreateChatRoom(
          request.senderId,
          request.receiverId,
        );
      } catch (_) {}
      return request;
    }

    if (
      request.status !==
      FriendStatus.PENDING
    ) {
      throw new BadRequestException(
        'Request cannot be accepted',
      );
    }

    request.status =
      FriendStatus.ACCEPTED;

    const savedRequest = await this.friendRepo.save(
      request,
    );

    return this.finalizeFriendRequestAcceptance(
      savedRequest,
    );
  }

  private async notifyFriendRequestRejected(
    rejectorId: number,
    requesterId: number,
  ) {
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

  async rejectFriendRequest(
    requestId: number,
  ) {
    const request =
      await this.friendRepo.findOne({
        where: {
          id: requestId,
        },
      });

    if (!request) {
      throw new BadRequestException(
        'Request not found',
      );
    }

    if (
      request.status !==
      FriendStatus.PENDING
    ) {
      throw new BadRequestException(
        'Request cannot be rejected',
      );
    }

    request.status =
      FriendStatus.REJECTED;

    await this.notificationsService.deleteNotification(request.senderId, request.receiverId, 'friend_request');
    await this.notifyFriendRequestRejected(request.receiverId, request.senderId);

    return this.friendRepo.save(
      request,
    );
  }

  async rejectFriendRequestByUsers(
    rejectorId: number,
    requesterId: number,
  ) {
    const request =
      await this.friendRepo.findOne({
        where: {
          senderId: requesterId,
          receiverId: rejectorId,
          status:
            FriendStatus.PENDING,
        },
      });

    if (!request) {
      throw new BadRequestException(
        'Request not found',
      );
    }

    request.status =
      FriendStatus.REJECTED;

    await this.notificationsService.deleteNotification(requesterId, rejectorId, 'friend_request');
    await this.notifyFriendRequestRejected(rejectorId, requesterId);

    return this.friendRepo.save(
      request,
    );
  }

  async acceptFriendRequestByUsers(
    acceptorId: number,
    requesterId: number,
  ) {
    const request = await this.friendRepo.findOne({
      where: {
        senderId: requesterId,
        receiverId: acceptorId,
      },
    });

    if (!request) {
      throw new BadRequestException(
        'Request not found',
      );
    }

    if (
      request.status ===
      FriendStatus.ACCEPTED
    ) {
      await this.ensureFriendshipExists(
        request.senderId,
        request.receiverId,
      );
      try {
        await this.chatService.getOrCreateChatRoom(
          request.senderId,
          request.receiverId,
        );
      } catch (_) {}
      return request;
    }

    if (
      request.status !==
      FriendStatus.PENDING
    ) {
      throw new BadRequestException(
        'Request cannot be accepted',
      );
    }

    request.status =
      FriendStatus.ACCEPTED;

    const savedRequest = await this.friendRepo.save(request);

    return this.finalizeFriendRequestAcceptance(
      savedRequest,
    );
  }

  // =========================
  // CHECK REVERSE REQUEST STATUS
  // =========================
  async getReverseRequestStatus(
    userId1: number,
    userId2: number,
  ): Promise<{ exists: boolean; status?: FriendStatus }> {
    const reverseRequest =
      await this.friendRepo.findOne({
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

  // =========================
  // GET FRIENDS

  async getFriends(
    userId: number,
  ) {
    const friendIds = new Set<number>();
    const uid = Number(userId);

    const friendships =
      await this.friendshipRepo.find({
        where: [
          { user1Id: uid },
          { user2Id: uid },
        ],
      });

    for (const friendship of friendships) {
      const u1 = Number(friendship.user1Id);
      const u2 = Number(friendship.user2Id);
      friendIds.add(
        u1 === uid ? u2 : u1,
      );
    }

    const acceptedRequests =
      await this.friendRepo.find({
        where: [
          {
            senderId: uid,
            status: FriendStatus.ACCEPTED,
          },
          {
            receiverId: uid,
            status: FriendStatus.ACCEPTED,
          },
        ],
      });

    for (const request of acceptedRequests) {
      const sid = Number(request.senderId);
      const rid = Number(request.receiverId);
      friendIds.add(
        sid === uid ? rid : sid,
      );
    }

    if (friendIds.size === 0) {
      return [];
    }

    return this.userRepo.find({
      where: {
        id: In(Array.from(friendIds)),
      },
    });
  }

  // =========================
  // GET MUTUAL FRIENDS
  // =========================

  async getMutualFriends(
    userId: number,
  ) {
    return this.getFriends(userId);
  }

  // =========================
  // GET PENDING REQUESTS
  // =========================

  async getPendingRequests(
    userId: number,
  ) {
    const requests =
      await this.friendRepo.find({
        where: {
          receiverId: userId,
          status:
            FriendStatus.PENDING,
        },
        order: {
          createdAt: 'DESC',
        },
      });

    if (requests.length == 0) {
      return [];
    }

    const senderIds =
      requests.map(
        (request) => request.senderId,
      );

    const senders = await this.userRepo.findBy({
      id: In(senderIds),
    });

    return requests.map((request) => {
      const sender = senders.find(
        (user) => user.id === request.senderId,
      );

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
                name:
                    sender.name || sender.email || 'Unknown',
                imageUrl: sender.imageUrl || '',
              },
      };
    });
  }

  async getFriendStatus(
    userId: number,
    otherUserId: number,
  ) {
    const areFriends = await this.areUsersAlreadyFriends(
      userId,
      otherUserId,
    );

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
        status: FriendStatus.PENDING,
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
        status: FriendStatus.PENDING,
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
}