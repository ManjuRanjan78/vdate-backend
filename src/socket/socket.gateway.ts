import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';
import { Inject, forwardRef } from '@nestjs/common';

import { RedisService } from '../redis/redis.service';
import { UsersService } from '../users/users.service';
import { MatchService } from '../matches/matches.service';
import { ChatService } from '../chat/chat.service';
import { FriendsService } from '../friends/friends.service';
import { FriendStatus } from '../friends/entities/friend.entity';
import { CallsService } from '../calls/calls.service';
import { LivekitService } from '../livekit/livekit.service';
import { FirebaseService } from '../firebase/firebase.service';


@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:3000',
      'http://192.168.0.4:3000',
      'http://192.168.0.4:8080',
      'https://yourdomain.com',
      /^http:\/\/192\.168\..*:\d+$/,  // Allow any 192.168.x.x connection
    ],
    credentials: true,
  },
})
export class SocketGateway
  implements
    OnGatewayConnection,
    OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private activeCallTimers = new Map<string, NodeJS.Timeout>();
  
  private readonly PREDEFINED_MESSAGES = [
    'Hello!',
    'Hi',
    'How are you?',
    'Nice to meet you!',
    'Smile!',
    'Wow!',
    'You look great!'
  ];

constructor(
  private redisService: RedisService,
  private usersService: UsersService,
  private readonly matchService: MatchService,
  @Inject(forwardRef(() => FriendsService))
  private readonly friendsService: FriendsService,
  private readonly callsService: CallsService,
  private readonly livekitService: LivekitService,
  private readonly firebaseService: FirebaseService,
  private readonly chatService: ChatService,
) {}

  private normalizePreference(value?: string | null): string {
    if (!value || value.trim() === '') {
      return 'both';
    }

    const pref = value.toLowerCase().trim();

    if (pref === 'male') return 'male';
    if (pref === 'female') return 'female';

    return 'both';
  }

  private getSearchIntentKey(
    userId: string,
  ) {
    return `searching:${userId}`;
  }

  private async setSearchIntent(
    userId: string,
    searching: boolean,
  ) {
    const key = this.getSearchIntentKey(
      userId,
    );

    console.log('SEARCH_STATE_CHANGED', {
      userId,
      isSearching: searching,
    });

    if (searching) {
      await this.redisService.set(
        key,
        true,
        86400,
      );
      return;
    }

    await this.redisService.del(
      key,
    );
  }

  private async isSearchIntentActive(
    userId: string,
  ): Promise<boolean> {
    const value = await this.redisService.get(
      this.getSearchIntentKey(
        userId,
      ),
    );
    return !!value;
  }

  private async getQueueState(
    userId: string,
  ): Promise<'waiting' | 'idle'> {
    const active = await this.redisService.get(
      `queue:${userId}`,
    );
    return active ? 'waiting' : 'idle';
  }

  private async getSocketForUser(
    userId: string,
  ): Promise<Socket | null> {
    const socketId = await this.redisService.get(
      `socket:${userId}`,
    );
    if (!socketId) {
      return null;
    }

    const socket =
      this.server.sockets.sockets.get(
        socketId,
      );

    if (!socket || !socket.connected) {
      return null;
    }

    return socket;
  }

  private async logMatchmakingState(
    event: string,
    userId: string,
    data: object = {},
  ) {
    const queueState = await this.getQueueState(
      userId,
    );
    const isSearching = await this.isSearchIntentActive(
      userId,
    );
    const isInCall =
      !!(await this.redisService.isBusy(
        userId,
      )) ||
      !!(await this.redisService.getMatched(
        userId,
      ));

    console.log(
      event,
      {
        userId,
        queueState,
        isSearching,
        isInCall,
        ...data,
      },
    );
  }

  private async resumeUserSearch(
    userId: string,
  ) {
    const intent = await this.isSearchIntentActive(
      userId,
    );
    if (!intent) {
      return;
    }

    const socket = await this.getSocketForUser(
      userId,
    );
    if (!socket) {
      return;
    }

    const user = await this.usersService.findById(
      userId,
    );
    if (!user || !user.gender) {
      return;
    }

    const preferenceGender =
      await this.matchService.getQueuePreferenceGender(
        userId,
      );
    const preferenceLocation =
      (await this.matchService.getQueuePreferenceLocation(
        userId,
      )) || '';

    await this.logMatchmakingState(
      'SEARCH_RESUMED',
      userId,
      {
        preferenceGender,
        preferenceLocation,
      },
    );

    await this.findMatch(socket, {
      preferenceGender,
      preferenceLocation,
    });
  }

  private async sendFriendRequestPush(
    toUserId: number,
    fromUserId: number,
  ) {
    try {
      const receiver = await this.usersService.findById(toUserId);
      const sender = await this.usersService.findById(fromUserId);
      if (!receiver?.fcmToken) {
        return;
      }

      const senderName = sender?.name || 'Someone';

      await this.firebaseService.sendNotification(
        receiver.fcmToken,
        'New friend request',
        `${senderName} sent you a friend request`,
        {
          type: 'friend_request',
          fromUserId: String(fromUserId),
        },
      );
    } catch (error) {
      console.error('Friend request push error:', error);
    }
  }

  private async sendFriendAcceptedPush(
    toUserId: number,
    fromUserId: number,
  ) {
    try {
      const receiver = await this.usersService.findById(toUserId);
      const accepter = await this.usersService.findById(fromUserId);
      if (!receiver?.fcmToken) {
        return;
      }

      const accepterName = accepter?.name || 'Someone';
      await this.firebaseService.sendNotification(
        receiver.fcmToken,
        'Friend request accepted',
        `${accepterName} accepted your friend request`,
        {
          type: 'friend_request_accepted',
          fromUserId: String(fromUserId),
        },
      );
    } catch (error) {
      console.error('Friend accepted push error:', error);
    }
  }

  private async sendFriendRejectedPush(
    toUserId: number,
    fromUserId: number,
  ) {
    try {
      const receiver = await this.usersService.findById(toUserId);
      const rejector = await this.usersService.findById(fromUserId);
      if (!receiver?.fcmToken) {
        return;
      }

      const rejectorName = rejector?.name || 'Someone';
      await this.firebaseService.sendNotification(
        receiver.fcmToken,
        'Friend request declined',
        `${rejectorName} declined your friend request`,
        {
          type: 'friend_request_rejected',
          fromUserId: String(fromUserId),
        },
      );
    } catch (error) {
      console.error('Friend rejected push error:', error);
    }
  }

  private async sendConversationUpdate(userId: number) {
    try {
      const conversations = await this.chatService.getChatRooms(userId);
      this.server.to(`chat_user_${userId}`).emit('conversation_updated', conversations);
    } catch (error) {
      console.error('Send conversation update error:', error);
    }
  }

  private async sendBadgeUpdate(userId: number) {
    try {
      const unreadCount = await this.chatService.getUnreadBadgeCount(userId);
      this.server.to(`chat_user_${userId}`).emit('chat_badge_updated', { unreadCount });
    } catch (error) {
      console.error('Send badge update error:', error);
    }
  }

  // =========================
  // USER CONNECT
  // =========================
  async handleConnection(
    client: Socket,
  ) {
    try {
      const userId = client.handshake.query.userId as string;

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


      const oldSocketId =
  await this.redisService.get(
    `socket:${userId}`,
  );

if (
  oldSocketId &&
  oldSocketId !== client.id
) {

  const oldSocket =
    this.server.sockets.sockets.get(
      oldSocketId,
    );

if (
  oldSocket &&
  oldSocket.connected &&
  oldSocket.id !== client.id
) {

  console.log(
    `Disconnecting old socket: ${oldSocket.id}`,
  );

  oldSocket.disconnect(
    true,
  );
}
}
      // SAVE SOCKET ID
 await this.redisService.set(
  `socket:${userId}`,
  client.id,
  86400,
);

     await this.usersService.setUserOnline(
  userId,
);

      await this.redisService.set(
        `heartbeat:${userId}`,
        String(Date.now()),
        60,
      );

      console.log(` User Online: ${userId}`);

      client.emit('connected', {
  success: true,
  userId,
});

    } catch (error) {
      console.log('Socket Connection Error:', error);
    }
  }

  // =========================
  // USER DISCONNECT
  // =========================
  async handleDisconnect(
    client: Socket,
  ) {
    try {
      const userId = client.handshake.query.userId as string;
      console.log('SOCKET_DISCONNECT_EVENT', { userId, socketId: client.id });

      if (!userId) return;

      const user = await this.usersService.findById(userId);
      if (!user) return;


    setTimeout(async () => {

  try {

    const socketStillExists =
      await this.redisService.get(
        `socket:${userId}`,
      );

    // USER RECONNECTED
    if (
      socketStillExists &&
      socketStillExists !== client.id
    ) {
      console.log(
        `User reconnected before cleanup: ${userId}`,
      );
      return;
    }

    // =========================
    // FINAL OFFLINE CLEANUP
    // =========================

    await this.redisService.del(
      `socket:${userId}`,
    );

    await this.usersService.setUserOffline(
      userId,
    );

    await this.redisService.removeBusy(
      userId,
    );

    await this.redisService.clearMatched(
      userId,
    );

    await this.matchService.removeFromQueue(
      userId,
      user.gender,
    );

    console.log(
      `User offline after timeout: ${userId}`,
    );

    // =========================
    // LIVE STREAM CLEANUP
    // =========================
    if (user.isLive) {
      console.log(`Broadcaster ${userId} offline. Ending live stream.`);
      await this.usersService.updateUser(userId, { isLive: false, viewerCount: 0 });
      this.server.to(`live_${userId}`).emit('live_ended', { hostId: userId });
      this.server.emit('live_rooms_updated');
    }

    if ((client as any).liveHostId) {
      const hostId = (client as any).liveHostId;
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

  } catch (e) {

    console.log(
      'Delayed disconnect cleanup error:',
      e,
    );
  }

}, 10000);



      // CLEANUP ACTIVE CALLS & TIMERS
      for (const [channel, timer] of this.activeCallTimers.entries()) {
        if (channel.includes(`_${userId}_`) || channel.endsWith(`_${userId}`)) {

          const stillConnected =
  await this.redisService.get(
    `socket:${userId}`,
  );

if (stillConnected) {

  const activeSocket =
    this.server.sockets.sockets.get(
      stillConnected,
    );

  if (activeSocket) {
    continue;
  }
}
          clearInterval(timer);
          this.activeCallTimers.delete(channel);
          
          // End call for the other user
         const parts =
  channel
    .replace('room_', '')
    .split('_');
          const otherUserId = parts[0] === userId ? parts[1] : parts[0];
          
          await this.redisService.removeBusy(
  otherUserId,
);

await this.redisService.clearMatched(
  otherUserId,
);
          this.server
  .to(`user_${otherUserId}`)
  .emit(
    'call_ended',
    {
      reason:
        'User disconnected',
    },
  );

          await this.resumeUserSearch(
            otherUserId,
          );
        }
      }

      // REMOVE FROM QUEUE
     

    console.log(`❌ User Offline: ${userId}`);

    } catch (error) {
      console.log('Socket Disconnect Error:', error);
    }
  }

  // =========================
  // SEND MESSAGE
  // =========================
  @SubscribeMessage('message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
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
    .emit(
      'message',
      {
        ...data,
        fromUserId:
          client.handshake.query.userId,
      },
    );
}

    return {
      success: true,
      message: 'Message received and forwarded',
      data,
    };
  }

  // =========================
  // ADD FRIEND FOR MUTUAL CONNECTION
  // =========================
  @SubscribeMessage('add_friend')
  async handleAddFriend(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    try {
      const fromUserId = Number(client.handshake.query.userId as string);
      const toUserId = Number(data.toUserId);
      if (!fromUserId || !toUserId) return { success: false, message: 'Invalid data' };

      await this.friendsService.sendFriendRequest(
        fromUserId,
        toUserId,
      );

      await this.redisService.set(
        `friend_req:${fromUserId}:${toUserId}`,
        'true',
      );

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

      await this.sendFriendRequestPush(
        toUserId,
        fromUserId,
      );

      return {
        success: true,
        message:
          'Friend request sent',
      };
    } catch (error) {
       console.log('Add Friend Error:', error);
       const message = error instanceof Error ? error.message : 'Failed to add friend';
       return { success: false, message };
    }
  }

  @SubscribeMessage('send_friend_request')
async handleSendFriendRequest(
  @ConnectedSocket() client: Socket,
  @MessageBody() data: any,
) {
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
  } catch (error) {
    console.log('Send Friend Request Error:', error);
    return {
      success: false,
      message: 'Failed to notify user',
    };
  }
}

@SubscribeMessage('accept_friend_request')
async handleAcceptFriendRequest(
  @ConnectedSocket() client: Socket,
  @MessageBody() data: any,
) {
  try {
    const acceptorId = Number(client.handshake.query.userId);
    const requesterId = Number(data.to);

    if (!acceptorId || !requesterId) {
      return {
        success: false,
        message: 'Invalid data',
      };
    }

    await this.friendsService.acceptFriendRequestByUsers(
      acceptorId,
      requesterId,
    );

    // Ensure a chat room exists when a friend request is accepted by users
    try {
      await this.chatService.getOrCreateChatRoom(requesterId, acceptorId);
    } catch (err) {
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
    } catch (updateError) {
      console.log('Conversation update error after friend accept:', updateError);
    }

    await this.sendFriendAcceptedPush(requesterId, acceptorId);

    return {
      success: true,
      message: 'Friend request accepted notification sent',
    };
  } catch (error) {
    console.log('Accept Friend Request Error:', error);
    return {
      success: false,
      message: 'Failed to notify acceptance',
    };
  }
}

@SubscribeMessage('reject_friend_request')
async handleRejectFriendRequest(
  @ConnectedSocket() client: Socket,
  @MessageBody() data: any,
) {
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
      await this.friendsService.rejectFriendRequestByUsers(
        fromUserId,
        toUserId,
      );
    } catch (error) {
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
  } catch (error) {
    console.log('Reject Friend Request Error:', error);
    return {
      success: false,
      message: 'Failed to notify rejection',
    };
  }
}

  // =========================
  // GO ONLINE/OFFLINE FOR CALLS (FEMALE STATUS TOGGLE)
  // =========================

  @SubscribeMessage('go_online_calls')
  async handleGoOnlineCalls(
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userId = client.handshake.query.userId as string;
      if (!userId) return { success: false, message: 'User ID missing' };
      
      console.log('EMITTED_go_online_calls_backend', { userId, socketId: client.id });

      await this.usersService.setUserOnlineForCalls(userId);
      return { success: true };
    } catch (error) {
      console.error('go_online_calls error:', error);
      return { success: false, message: 'Failed to go online for calls' };
    }
  }

  @SubscribeMessage('go_offline_calls')
  async handleGoOfflineCalls(
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userId = client.handshake.query.userId as string;
      if (!userId) return { success: false, message: 'User ID missing' };

      console.log('EMITTED_go_offline_calls_backend', { userId, socketId: client.id });

      await this.usersService.setUserOfflineForCalls(userId);
      return { success: true };
    } catch (error) {
      console.error('go_offline_calls error:', error);
      return { success: false, message: 'Failed to go offline for calls' };
    }
  }

  @SubscribeMessage('heartbeat')
  async handleHeartbeat(
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userId = client.handshake.query.userId as string;
      if (!userId) return { success: false, message: 'User ID missing' };

      await this.redisService.set(
        `heartbeat:${userId}`,
        String(Date.now()),
        60,
      );
      return { success: true };
    } catch (error) {
      return { success: false, message: 'Heartbeat error' };
    }
  }

  // =========================
  // FIND MATCH
  // =========================

@SubscribeMessage('find_match')
async findMatch(
  @ConnectedSocket() client: Socket,
  @MessageBody() data: any,
) {

  let userId = '';
  let matchedUserId: string | null = null;

  try {

    userId =
      String(
        client.handshake.query.userId,
      );

    console.log(
      'MATCH_START_REQUEST',
      {
        userId,
        preferenceGender: data?.preferenceGender || '',
        preferenceLocation: data?.preferenceLocation || '',
      }
    );

    console.log(
      `Searching user: ${userId}`,
    );

    // =========================
    // GET CURRENT USER
    // =========================

    const currentUser =
      await this.usersService.findById(
        userId,
      );

    if (!currentUser) {

      client.emit(
        'match_error',
        {
          success: false,
          message: 'User not found',
        },
      );

      return;
    }

    const gender =
      currentUser.gender
        ?.toLowerCase()
        .trim();

    if (!gender) {

      client.emit(
        'match_error',
        {
          success: false,
          message: 'Gender missing',
        },
      );

      return;
    }

    console.log(
      'MATCH_REQUEST_RECEIVED',
      {
        currentUserId: userId,
        currentGender: gender,
        currentPreference:
          data?.preferenceGender || '',
        regionMode:
          data?.preferenceLocation || '',
      },
    );

    // =========================
    // CHECK BUSY
    // =========================

    const isBusy =
      await this.redisService.get(
        `busy:${userId}`,
      );

    if (isBusy) {

      client.emit(
        'match_error',
        {
          success: false,
          message:
            'User already busy',
        },
      );

      return;
    }

    await this.setSearchIntent(
      userId,
      true,
    );

    // =========================
    // REMOVE OLD QUEUE
    // =========================

    await this.matchService.removeFromQueue(
      userId,
      gender,
    );

    await this.redisService.del(
      `queue:${userId}`,
    );

    // =========================
    // FIND MATCH
    // =========================

    const preferenceGender = this.normalizePreference(data?.preferenceGender);
    const preferenceLocation = data?.preferenceLocation || '';

    console.log('PREFERENCE_SELECTED', {
      userId,
      preferenceGender,
      preferenceLocation,
    });

    console.log(
      'AUDIT_FIND_MATCH_CALLED',
      {
        userId,
        gender,
        preferenceGender,
        preferenceLocation,
      },
    );

    matchedUserId =
      await this.matchService.getMatch(
        userId,
        gender,
        preferenceGender,
        preferenceLocation,
      );

    console.log(
      'AUDIT_FIND_MATCH_RESULT',
      {
        userId,
        matchedUserId,
        found: !!matchedUserId,
      },
    );

    // =========================
    // NO MATCH FOUND
    // =========================

    if (
      !matchedUserId ||
      matchedUserId === userId
    ) {

      console.log(
        'AUDIT_NO_MATCH_ADDING_TO_QUEUE',
        {
          userId,
          gender,
          preferenceGender,
          preferenceLocation,
        },
      );

      await this.matchService.addToQueue(
        userId,
        gender,
        preferenceGender,
        preferenceLocation,
      );

      console.log(
        'QUEUE_JOIN_SUCCESS',
        { userId, gender },
      );

      await this.redisService.set(
        `queue:${userId}`,
        'true',
        120,
      );

      const queueState = await this.redisService.smembers(gender === 'male' ? 'male_waiting' : 'female_waiting');
      console.log(
        'QUEUE_STATE',
        { userId, gender, queueLength: queueState.length, queueUsers: queueState }
      );

      await this.logMatchmakingState(
        'QUEUE_JOINED',
        userId,
        {
          preferenceGender,
          preferenceLocation,
        },
      );

      client.emit(
        'waiting',
        {
          success: true,
          message:
            'Searching users...',
        },
      );

      return;
    }

    // =========================
    // GET MATCHED USER
    // =========================

    const matchedUser =
      await this.usersService.findById(
        matchedUserId,
      );

    if (!matchedUser) {
      console.log(`Matched user missing: ${matchedUserId}`);

      // Clean up invalid matched user
      await this.redisService.del(`socket:${matchedUserId}`);
      await this.redisService.del(`queue:${matchedUserId}`);
      await this.matchService.removeFromQueue(matchedUserId, 'male');
      await this.matchService.removeFromQueue(matchedUserId, 'female');
      await this.redisService.clearMatched(matchedUserId);
      await this.usersService.setUserOffline(matchedUserId);
      await this.clearMatchingLocks(userId, matchedUserId);

      // Retry matching
      return this.findMatch(client, data);
    }

    if (
      !this.matchService.isMatchPreferenceCompatible(
        gender,
        preferenceGender,
        matchedUser.gender,
        await this.matchService.getQueuePreferenceGender(
          matchedUserId,
        ),
      )
    ) {
      console.log(
        'MATCH_VALIDATION_RESULT',
        {
          userId: userId,
          candidateId: matchedUserId,
          gender: gender,
          preference: preferenceGender,
          isOnline: true,
          isSearching: true,
          isInCall: false,
          regionMode: preferenceLocation,
          rejectionReason: 'Post-match preference mismatch',
        },
      );
      return this.findMatch(client, data);
    }

    // =========================
    // GET MATCHED SOCKET
    // =========================

    const matchedSocketId =
      await this.redisService.get(
        `socket:${matchedUserId}`,
      );

    console.log(
      `MATCH FOUND ${userId} ↔ ${matchedUserId}`,
    );

    console.log(
      `Receiver socket: ${matchedSocketId}`,
    );

    // =========================
    // VERIFY SOCKET IS ALIVE
    // =========================

    const matchedRoomSockets = await this.server.in(`user_${matchedUserId}`).fetchSockets();
    const hasActiveSockets = matchedRoomSockets && matchedRoomSockets.length > 0;

    const heartbeatTime = await this.redisService.get(`heartbeat:${matchedUserId}`);
    const hasRecentHeartbeat = !!heartbeatTime;

    console.log('SOCKET_VALIDATION', {
      userId: matchedUserId,
      socketId: matchedSocketId,
      hasActiveSockets,
      hasRecentHeartbeat,
      status: (matchedSocketId && hasActiveSockets && hasRecentHeartbeat) ? 'OK' : 'SOCKET_VALIDATION_WARNING',
    });

    if (!matchedSocketId || !hasActiveSockets || !hasRecentHeartbeat) {
      console.log(`Matched user socket missing, dead, or inactive: ${matchedUserId}`);

      // Clean up stale matched user
      await this.redisService.del(`socket:${matchedUserId}`);
      await this.redisService.del(`queue:${matchedUserId}`);
      await this.redisService.del(`heartbeat:${matchedUserId}`);
      await this.matchService.removeFromQueue(matchedUserId, 'male');
      await this.matchService.removeFromQueue(matchedUserId, 'female');
      await this.redisService.clearMatched(matchedUserId);
      await this.usersService.setUserOffline(matchedUserId);
      await this.clearMatchingLocks(userId, matchedUserId);

      // Retry matching
      return this.findMatch(client, data);
    }

    console.log('MATCH_FOUND', {
      callerId: userId,
      receiverId: matchedUserId,
    });

    // =========================
    // REMOVE BOTH FROM QUEUE
    // =========================

    await this.matchService.removeFromQueue(
      userId,
      gender,
    );

    await this.matchService.removeFromQueue(
      matchedUserId,
      matchedUser.gender,
    );

    await this.redisService.del(
      `queue:${userId}`,
    );

    await this.redisService.del(
      `queue:${matchedUserId}`,
    );

    await this.clearMatchingLocks(
      userId,
      matchedUserId,
    );

    // =========================
    // SET MATCH LOCK
    // =========================

    await this.redisService.setMatched(
      userId,
      matchedUserId,
    );

    await this.redisService.setMatched(
      matchedUserId,
      userId,
    );

    await this.redisService.addMatchHistory(
      userId,
      matchedUserId,
    );

    console.log(
      'MATCH_CREATED',
      {
        currentUserId: userId,
        candidateUserId: matchedUserId,
      },
    );

    // =========================
    // SET BUSY
    // =========================

    await this.redisService.setBusy(
      userId,
    );

    await this.redisService.setBusy(
      matchedUserId,
    );

    // =========================
    // CREATE ROOM
    // =========================

    const sortedIds =
      [userId, matchedUserId].sort();

    const roomName =
      `room_${sortedIds[0]}_${sortedIds[1]}`;

    console.log(
      'ROOM_CREATION_START',
      {
        userId,
        matchedUserId,
        roomName,
      }
    );

    // =========================
    // CREATE TOKENS
    // =========================

    const callerToken =
      await this.livekitService.createToken(
        userId,
        roomName,
      );

    const receiverToken =
      await this.livekitService.createToken(
        matchedUserId,
        roomName,
      );

    console.log(
      'ROOM_CREATION_SUCCESS',
      {
        userId,
        matchedUserId,
        roomName,
      }
    );

    console.log(
      'ROOM_CREATED',
      {
        userId,
        matchedUserId,
        roomName,
      }
    );

    // =========================
    // CREATE CALL SESSION
    // =========================

    const callResponse =
      await this.callsService.startVideoCall(
        userId,
        matchedUserId,
      );

    const callId =
      callResponse?.callId ??
      `call_${Date.now()}`;

    // =========================
    // SAFE USER DATA
    // =========================

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

    // =========================
    // SEND CALLER
    // =========================

  const callerPayload = {
  success: true,
  role: 'caller',
  playRingtone: false,

  callId,
  matchedUserId,

  matchedUser:
      safeMatchedUser,

  roomName,

  token: callerToken,

  livekitUrl:
      process.env.LIVEKIT_URL,
};

const receiverPayload = {
  success: true,
  role: 'receiver',
  playRingtone: true,

  callId,
  matchedUserId:
      userId,

  matchedUser:
      safeCurrentUser,

  roomName,

  token: receiverToken,

  livekitUrl:
      process.env.LIVEKIT_URL,
};

console.log(
  'MATCH_EVENT_SENT',
  {
    userId,
    matchedUserId,
    roomName,
  }
);

// Emit nearly simultaneously
await Promise.all([
  new Promise((resolve) => {
    console.log('ROOM_EMIT_MATCH', {
      userId,
      room: `user_${userId}`,
    });
    this.server.to(`user_${userId}`).emit(
      'match_found',
      callerPayload,
    );
    resolve(true);
  }),

  new Promise((resolve) => {
    console.log('ROOM_EMIT_MATCH', {
      userId: matchedUserId,
      room: `user_${matchedUserId}`,
    });
    this.server.to(`user_${matchedUserId}`).emit(
      'match_found',
      receiverPayload,
    );
    resolve(true);
  }),
]);

    console.log(
      'AUDIT_ROOM_CREATED',
      {
        currentUserId: userId,
        candidateUserId: matchedUserId,
        roomName,
      },
    );

    console.log(
      'AUDIT_MATCH_CREATED',
      {
        currentUserId: userId,
        candidateUserId: matchedUserId,
        callId,
      },
    );

    console.log(
      'AUDIT_CALL_STARTED',
      {
        currentUserId: userId,
        candidateUserId: matchedUserId,
        roomName,
        callId,
      },
    );

    await this.logMatchmakingState(
      'CALL_STARTED',
      userId,
      {
        matchedUserId,
        roomName,
        callId,
      },
    );

  } catch (error) {

    console.log(
      'Find Match Error:',
      error,
    );

    await this.clearMatchingLocks(
      userId,
      matchedUserId,
    );

    // =========================
    // CLEANUP FAILED MATCH
    // =========================

    try {

      if (userId) {

        await this.redisService.removeBusy(
          userId,
        );

        await this.redisService.clearMatched(
          userId,
        );
      }

      if (matchedUserId) {

        await this.redisService.removeBusy(
          matchedUserId,
        );

        await this.redisService.clearMatched(
          matchedUserId,
        );
      }

    } catch (cleanupError) {

      console.log(
        'Cleanup Error:',
        cleanupError,
      );
    }

    client.emit(
      'match_error',
      {
        success: false,
        message: 'Failed to find match: ' + (error instanceof Error ? error.message : String(error)),
      },
    );
  }
}

  @SubscribeMessage('start_direct_call')
  async startDirectCall(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { receiverId: string },
  ) {
    let userId = '';
    let matchedUserId: string | null = null;

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

      // Check if receiver is online
      const matchedSocketId = await this.redisService.get(`socket:${matchedUserId}`);
      const receiverSocket = matchedSocketId ? this.server.sockets.sockets.get(matchedSocketId) : null;
      const isReceiverOnline = receiverSocket && receiverSocket.connected;

      if (!isReceiverOnline && !matchedUser.fcmToken) {
        client.emit('match_error', { success: false, message: 'User is offline and unreachable' });
        return;
      }

      // Check if receiver is busy
      const receiverBusy = await this.redisService.isBusy(matchedUserId);
      if (receiverBusy) {
        client.emit('match_error', { success: false, message: 'User is in another call' });
        return;
      }

      // Check if caller is busy
      const callerBusy = await this.redisService.isBusy(userId);
      if (callerBusy) {
        client.emit('match_error', { success: false, message: 'You are already in another call' });
        return;
      }

      // Set match locks & busy status
      await this.redisService.setMatched(userId, matchedUserId);
      await this.redisService.setMatched(matchedUserId, userId);
      await this.redisService.setBusy(userId);
      await this.redisService.setBusy(matchedUserId);

      // Generate room and tokens
      const sortedIds = [userId, matchedUserId].sort();
      const roomName = `room_${sortedIds[0]}_${sortedIds[1]}`;

      const callerToken = await this.livekitService.createToken(userId, roomName);
      const receiverToken = await this.livekitService.createToken(matchedUserId, roomName);

      // Create call session
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

      // Emit to caller
      client.emit('match_found', callerPayload);
      
      // Emit to receiver if online
      if (isReceiverOnline) {
        receiverSocket.emit('match_found', receiverPayload);
      }

      // Send Push Notification
      if (matchedUser.fcmToken) {
        await this.firebaseService.sendNotification(
          matchedUser.fcmToken,
          'Incoming Video Call',
          `${currentUser.name || 'Someone'} is calling you`,
          {
            type: 'incoming_call',
            callId: String(callId),
            callerId: String(currentUser.id),
            callerName: currentUser.name || 'Someone',
            roomName: roomName,
            token: receiverToken,
            livekitUrl: process.env.LIVEKIT_URL || '',
            timestamp: String(Date.now()),
            callerAvatar: currentUser.imageUrl || '',
            callerGender: currentUser.gender || '',
          },
        );
      }

      console.log(`Direct Call established: ${userId} ↔ ${matchedUserId}`);

      // Auto terminate if not answered in 45s
      setTimeout(async () => {
        try {
          const callData = await this.redisService.get(`call:${callId}`);
          if (callData && callData.status === 'started') {
            console.log(`Call ${callId} timed out after 45s. Marking as missed.`);
            await this.callsService.updateCallStatus(callId, 'MISSED');
            
            await this.redisService.removeBusy(userId);
            if (matchedUserId) {
              await this.redisService.removeBusy(matchedUserId);
            }
            await this.redisService.clearMatched(userId);
            if (matchedUserId) {
              await this.redisService.clearMatched(matchedUserId);
            }
            
            this.server.to(`user_${userId}`).emit('call_ended', { reason: 'No answer' });
            
            if (matchedUser.fcmToken) {
              await this.firebaseService.sendNotification(
                matchedUser.fcmToken,
                'Missed Video Call',
                `You missed a call from ${currentUser.name || 'Someone'}`,
                {
                  type: 'missed_call',
                  callerId: String(userId),
                  callerName: currentUser.name || 'Someone',
                  timestamp: String(Date.now()),
                },
              );
            }
          }
        } catch (e) {
          console.error('Error in call timeout:', e);
        }
      }, 45000);

    } catch (error) {
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

private async clearMatchingLocks(
  userId: string,
  matchedUserId?: string | null,
) {
  if (!userId || !matchedUserId) {
    return;
  }

  await this.redisService.del(
    `matching:${userId}`,
  );
  await this.redisService.del(
    `matching:${matchedUserId}`,
  );
}

  @SubscribeMessage('user_online')
async handleUserOnline(
  @ConnectedSocket() client: Socket,
  @MessageBody() data: any,
) {

  try {

    const {
      userId,
    } = data;

    if (!userId) {
      return;
    }

await this.redisService.set(
  `socket:${userId}`,
  client.id,
  86400,
);

    console.log(
      `User socket updated: ${userId} -> ${client.id}`,
    );

  } catch (error) {

    console.log(
      'User Online Error:',
      error,
    );
  }
}


@SubscribeMessage('call_connected')
async handleCallConnected(
  @MessageBody() data: any,
) {

  try {

    const {
      roomName,
      userId,
      matchedUserId,
    } = data;

    if (
      this.activeCallTimers.has(
        roomName,
      )
    ) {
      return;
    }

    console.log(
      'CALL_CONNECTED',
      { roomName, userId, matchedUserId }
    );

    this.startCoinDeduction(
      roomName,
      userId,
      matchedUserId,
    );

  } catch (e) {

    console.log(
      'Call Connected Error:',
      e,
    );
  }
}

  // =========================
  // REJECT CALL
  // =========================
  @SubscribeMessage('reject_call')
  async handleRejectCall(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    try {
      const { callId, userId, matchedUserId } = data;
      
      if (callId) {
        await this.callsService.updateCallStatus(callId, 'REJECTED');
      }

      await this.redisService.removeBusy(userId);
      await this.redisService.removeBusy(matchedUserId);
      await this.redisService.clearMatched(userId);
      await this.redisService.clearMatched(matchedUserId);

      this.server.to(`user_${matchedUserId}`).emit('call_rejected', {
        reason: 'Call declined',
      });
      console.log(`Call rejected by ${userId} for ${matchedUserId}`);
    } catch (e) {
      console.log('Error forwarding reject_call:', e);
    }
  }

  // =========================
  // ACCEPT CALL
  // =========================
  @SubscribeMessage('accept_call')
  async handleAcceptCall(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    try {
      const { callId, matchedUserId } = data;
      if (callId) {
        await this.callsService.updateCallStatus(callId, 'ACCEPTED');
      }
      this.server.to(`user_${matchedUserId}`).emit('accept_call', data);
      console.log(`Forwarded accept_call to user_${matchedUserId}`);
    } catch (e) {
      console.log('Error forwarding accept_call:', e);
    }
  }

  // =========================
  // LEAVE CALL
  // =========================
  @SubscribeMessage('leave_call')
  async leaveCall(
    @MessageBody() data: any,
  ) {
    try {
      const { callId, userId, matchedUserId } = data;
      const resumeIntent = data?.intent === 'resume';

      if (!resumeIntent) {
        await this.setSearchIntent(
          userId,
          false,
        );
      }

  await this.redisService.removeBusy(
  userId,
);

await this.redisService.removeBusy(
  matchedUserId,
);

await this.redisService.clearMatched(
  userId,
);

await this.redisService.clearMatched(
  matchedUserId,
);


await this.redisService.del(
  `queue:${userId}`,
);

await this.redisService.del(
  `queue:${matchedUserId}`,
);

await this.logMatchmakingState(
  'CALL_ENDED',
  userId,
  {
    matchedUserId,
    intent: resumeIntent ? 'resume' : 'stop',
  },
);

if (resumeIntent) {
  await this.resumeUserSearch(userId);
}

if (matchedUserId) {
  await this.resumeUserSearch(
    matchedUserId,
  );
}
// =========================
// NOTIFY OTHER USER
// =========================

this.server
  .to(`user_${matchedUserId}`)
  .emit(
    'call_ended',
    {
      reason:
        'User left the call',
    },
  );

      const sortedIds =
  [userId, matchedUserId].sort();

const roomName =
  `room_${sortedIds[0]}_${sortedIds[1]}`;

// Check if call was ever connected by checking if timer exists
const callWasConnected = this.activeCallTimers.has(roomName);

if (!callWasConnected) {
  try {
    if (callId) {
      await this.callsService.updateCallStatus(callId, 'MISSED');
    }
    const matchedUser = await this.usersService.findById(matchedUserId);
    const caller = await this.usersService.findById(userId);
    if (matchedUser && matchedUser.fcmToken) {
      await this.firebaseService.sendNotification(
        matchedUser.fcmToken,
        'Missed Video Call',
        `You missed a call from ${caller?.name || 'Someone'}`,
        {
          type: 'missed_call',
          callerId: String(userId),
          callerName: caller?.name || 'Someone',
          timestamp: String(Date.now()),
        },
      );
    }
  } catch (error) {
    console.error('Missed call notification error:', error);
  }
} else {
  if (callId) {
    try {
      await this.callsService.endVideoCall(callId);
    } catch(e) {}
  }
}

  console.log(
  '=========================',
);

console.log(
  `ROOM CREATED: ${roomName}`,
);

console.log({
  caller: userId,
  receiver: matchedUserId,
});

console.log(
  '=========================',
);

if (
  this.activeCallTimers.has(
    roomName,
  )
) {

  clearInterval(
    this.activeCallTimers.get(
      roomName,
    )!,
  );

  this.activeCallTimers.delete(
    roomName,
  );
}

      console.log(`Call Ended: ${userId} ↔ ${matchedUserId}`);
    } catch (error) {
      console.log('Leave Call Error:', error);
    }
  }

  // =========================
  // COIN DEDUCTION LOGIC
  // =========================
  private startCoinDeduction(channelName: string, userId1: string, userId2: string) {
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

        await this.usersService.updateCoins(
  userId1,
  -25,
);

await this.usersService.updateCoins(
  userId2,
  -25,
);
       } catch (e) {
         console.error('Coin deduction error:', e);
       }
    };

    // First deduction right away
    deduct();

    // Subsequent deductions every 20 seconds
    const interval = setInterval(deduct, 20000);
    this.activeCallTimers.set(channelName, interval);
  }

  private async endCallDueToCoins(channelName: string, userId1: string, userId2: string) {
    const timer = this.activeCallTimers.get(channelName);
    if (timer) {
      clearInterval(timer);
      this.activeCallTimers.delete(channelName);
    }

   await this.redisService.removeBusy(
  userId1,
);

await this.redisService.removeBusy(
  userId2,
);

await this.redisService.clearMatched(
  userId1,
);

await this.redisService.clearMatched(
  userId2,
);

    this.server
  .to(`user_${userId1}`)
  .emit(
    'call_ended',
    {
      reason:
        'Insufficient coins',
    },
  );

this.server
  .to(`user_${userId2}`)
  .emit(
    'call_ended',
    {
      reason:
        'Insufficient coins',
    },
  );

    await this.logMatchmakingState(
      'CALL_ENDED',
      userId1,
      {
        matchedUserId: userId2,
        reason: 'Insufficient coins',
      },
    );

    await this.logMatchmakingState(
      'CALL_ENDED',
      userId2,
      {
        matchedUserId: userId1,
        reason: 'Insufficient coins',
      },
    );

    await this.resumeUserSearch(
      userId1,
    );
    await this.resumeUserSearch(
      userId2,
    );
  }

  @SubscribeMessage('leave_queue')
async handleLeaveQueue(
  @MessageBody() data: any,
) {

  try {

    const {
      userId,
    } = data;

    if (!userId) {
      return;
    }

    const user =
      await this.usersService.findById(
        userId,
      );

    if (!user) {
      return;
    }

    await this.matchService.removeFromQueue(
      userId,
      user.gender,
    );

    await this.setSearchIntent(
      userId,
      false,
    );

    await this.redisService.del(
  `queue:${userId}`,
);
    console.log(
      `User removed from queue: ${userId}`,
    );

    await this.logMatchmakingState(
      'QUEUE_REMOVED',
      userId,
    );
  } catch (error) {
    console.log('Leave Queue Error:', error);
  }
}

  @SubscribeMessage('host_start_live')
  async handleHostStartLive(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { hostId: string; title?: string; category?: string; coverUrl?: string },
  ) {
    try {
      const hostId = data.hostId || (client.handshake.query.userId as string);
      console.log(`Host starting live stream: ${hostId}`);

      await this.usersService.updateUser(hostId, {
        isLive: true,
        viewerCount: 0,
      });

      client.join(`live_${hostId}`);

      // Generate LiveKit token for the host
      const roomName = `live_${hostId}`;
      const token = await this.livekitService.createToken(hostId, roomName);

      this.server.emit('live_rooms_updated'); // notify viewers to refresh list

      return {
        success: true,
        roomName,
        token,
        livekitUrl: process.env.LIVEKIT_URL,
      };
    } catch (e: any) {
      console.error('Host start live error:', e);
      return { success: false, message: e.message };
    }
  }

  @SubscribeMessage('host_stop_live')
  async handleHostStopLive(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { hostId: string },
  ) {
    try {
      const hostId = data.hostId || (client.handshake.query.userId as string);
      console.log(`Host stopping live stream: ${hostId}`);

      await this.usersService.updateUser(hostId, {
        isLive: false,
        viewerCount: 0,
      });

      const roomName = `live_${hostId}`;
      this.server.to(roomName).emit('live_ended', { hostId });

      // Clean up sockets in that room
      const roomSockets = await this.server.in(roomName).fetchSockets();
      for (const socket of roomSockets) {
        (socket as any).liveHostId = null;
        socket.leave(roomName);
      }

      this.server.emit('live_rooms_updated');

      return { success: true };
    } catch (e: any) {
      console.error('Host stop live error:', e);
      return { success: false, message: e.message };
    }
  }

  @SubscribeMessage('join_live')
  async handleJoinLive(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { hostId: string; userId: string },
  ) {
    try {
      const { hostId, userId } = data;
      console.log(`Viewer ${userId} joining live stream of ${hostId}`);

      const roomName = `live_${hostId}`;
      client.join(roomName);
      (client as any).liveHostId = hostId;

      // Increment viewer count
      const host = await this.usersService.findById(hostId);
      let newCount = 1;
      if (host) {
        newCount = (host.viewerCount || 0) + 1;
        await this.usersService.updateUser(hostId, { viewerCount: newCount });

        // Retrieve viewer's details
        const viewer = await this.usersService.findById(userId);

        // Broadcast join event
        this.server.to(roomName).emit('viewer_joined', {
          viewerCount: newCount,
          userId,
          name: viewer?.name || 'Someone',
          avatarUrl: viewer?.imageUrl || '',
        });
      }

      // Generate LiveKit token for viewer (subscriber only)
      const token = await this.livekitService.createToken(userId, roomName);

      return {
        success: true,
        token,
        livekitUrl: process.env.LIVEKIT_URL,
      };
    } catch (e: any) {
      console.error('Join live error:', e);
      return { success: false, message: e.message };
    }
  }

  @SubscribeMessage('leave_live')
  async handleLeaveLive(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { hostId: string; userId: string },
  ) {
    try {
      const { hostId, userId } = data;
      console.log(`Viewer ${userId} leaving live stream of ${hostId}`);

      const roomName = `live_${hostId}`;
      client.leave(roomName);
      (client as any).liveHostId = null;

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
    } catch (e: any) {
      console.error('Leave live error:', e);
      return { success: false, message: e.message };
    }
  }

  @SubscribeMessage('live_comment')
  async handleLiveComment(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { hostId: string; userId: string; comment: string },
  ) {
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
    } catch (e: any) {
      console.error('Live comment error:', e);
      return { success: false, message: e.message };
    }
  }

  @SubscribeMessage('live_like')
  async handleLiveLike(
    @MessageBody() data: { hostId: string; userId: string },
  ) {
    try {
      const { hostId, userId } = data;
      const roomName = `live_${hostId}`;

      this.server.to(roomName).emit('live_like_received', {
        userId,
      });

      return { success: true };
    } catch (e: any) {
      console.error('Live like error:', e);
      return { success: false, message: e.message };
    }
  }

  @SubscribeMessage('live_gift')
  async handleLiveGift(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { hostId: string; fromUserId: string; giftId: string; giftName: string; giftCoins: number },
  ) {
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

      // Perform transfer
      const senderNewCoins = await this.usersService.updateCoins(fromUserId, -giftCoins);
      const receiverNewCoins = await this.usersService.updateCoins(hostId, giftCoins);

      // Notify room of gift
      this.server.to(roomName).emit('live_gift_received', {
        senderId: fromUserId,
        senderName: sender.name || 'Someone',
        giftId,
        giftName,
        giftCoins,
      });

      // Update balances individually via socket
      this.server.to(`user_${fromUserId}`).emit('balance_update', { coins: senderNewCoins });
      this.server.to(`user_${hostId}`).emit('balance_update', { coins: receiverNewCoins });

      return { success: true, newBalance: senderNewCoins };
    } catch (e: any) {
      console.error('Live gift error:', e);
      return { success: false, message: e.message };
    }
  }
}
