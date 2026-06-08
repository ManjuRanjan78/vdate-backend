import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly chatService: ChatService) {}

  async handleConnection(client: Socket) {
    const userId = Number(client.handshake.query.userId);
    if (!Number.isNaN(userId) && userId > 0) {
      client.join(`chat_user_${userId}`);
      await this.sendConversationUpdate(userId);
      await this.sendBadgeUpdate(userId);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.handshake.query.userId;
    if (userId) {
      client.leave(`chat_user_${userId}`);
    }
  }

  async sendBadgeUpdate(userId: number) {
    const unreadCount = await this.chatService.getUnreadBadgeCount(userId);
    this.server.to(`chat_user_${userId}`).emit('chat_badge_updated', { unreadCount });
  }

  async sendConversationUpdate(userId: number) {
    const conversations = await this.chatService.getChatRooms(userId);
    this.server.to(`chat_user_${userId}`).emit('conversation_updated', conversations);
  }

  async processChatMessage(
    client: Socket,
    data: {
      roomId?: string;
      receiverId?: number;
      message?: string;
      messageTemplateId?: number;
      clientMessageId?: string;
    },
  ) {
    try {
      const senderId = Number(client.handshake.query.userId);
      if (!senderId) return;

      const message = await this.chatService.sendChatMessage(senderId, {
        roomId: data.roomId,
        receiverId: data.receiverId,
        message: data.message,
        messageTemplateId: data.messageTemplateId,
        clientMessageId: data.clientMessageId,
      });

      const receiverId = message.receiverId;

      client.emit('chat_message', message);
      client.emit('message_sent', message);
      client.emit('message_delivered', message);

      this.server.to(`chat_user_${receiverId}`).emit('chat_message', message);
      this.server.to(`chat_user_${receiverId}`).emit('message_received', message);

      if (!message.isSystem) {
        const senderName = await this.chatService.getUserName(senderId);
        const unreadCount = await this.chatService.getUnreadBadgeCount(receiverId);
        this.server.to(`chat_user_${receiverId}`).emit('chat_notification', {
          roomId: message.roomId,
          senderId,
          senderName,
          text: message.text,
          notificationText: `You received a message from ${senderName}`,
          unreadCount,
        });
      }

      if (message.roomCreated) {
        this.server.to(`chat_user_${receiverId}`).emit('chat_room_created', {
          roomId: message.roomId,
          senderId,
          receiverId,
        });
        client.emit('chat_room_created', {
          roomId: message.roomId,
          senderId,
          receiverId,
        });
      }

      await this.sendConversationUpdate(senderId);
      await this.sendConversationUpdate(receiverId);
      await this.sendBadgeUpdate(receiverId);

      return message;
    } catch (error: any) {
      client.emit('error', { message: error?.message ?? String(error) });
    }
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      roomId?: string;
      receiverId?: number;
      message?: string;
      messageTemplateId?: number;
      clientMessageId?: string;
    },
  ) {
    return this.processChatMessage(client, data);
  }

  @SubscribeMessage('chat_message')
  async handleChatMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      roomId?: string;
      receiverId?: number;
      message?: string;
      messageTemplateId?: number;
      clientMessageId?: string;
    },
  ) {
    return this.processChatMessage(client, data);
  }

  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { roomId?: string; friendId?: number },
  ) {
    try {
      const userId = Number(client.handshake.query.userId);
      if (!userId) return;

      let room: any = null;
      if (data.roomId) {
        room = await this.chatService.getChatRoomById(userId, data.roomId);
      } else if (data.friendId != null) {
        room = await this.chatService.getChatRoomByFriend(userId, data.friendId);
      }
      if (!room) {
        return;
      }

      await this.chatService.markAsRead(userId, room._id.toString());
      const friendId = room.user1Id === userId ? room.user2Id : room.user1Id;
      const roomId = room._id.toString();

      client.emit('chat_read', { roomId, userId });
      this.server.to(`chat_user_${friendId}`).emit('chat_read', { roomId, userId });

      await this.sendConversationUpdate(userId);
      await this.sendConversationUpdate(friendId);
      await this.sendBadgeUpdate(userId);
    } catch (error: any) {
      client.emit('error', { message: error?.message ?? String(error) });
    }
  }

  @SubscribeMessage('chat_typing_started')
  async handleTypingStarted(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId?: string; friendId?: number },
  ) {
    try {
      const userId = Number(client.handshake.query.userId);
      if (!userId) return;

      let room: any = null;
      if (data.roomId) {
        room = await this.chatService.getChatRoomById(userId, data.roomId);
      } else if (data.friendId != null) {
        room = await this.chatService.getChatRoomByFriend(userId, data.friendId);
      }
      if (!room) {
        return;
      }

      const friendId = room.user1Id === userId ? room.user2Id : room.user1Id;
      const roomId = room._id.toString();
      this.server.to(`chat_user_${friendId}`).emit('chat_typing_started', {
        roomId,
        userId,
      });
    } catch (error: any) {
      client.emit('error', { message: error?.message ?? String(error) });
    }
  }

  @SubscribeMessage('chat_typing_stopped')
  async handleTypingStopped(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId?: string; friendId?: number },
  ) {
    try {
      const userId = Number(client.handshake.query.userId);
      if (!userId) return;

      let room: any = null;
      if (data.roomId) {
        room = await this.chatService.getChatRoomById(userId, data.roomId);
      } else if (data.friendId != null) {
        room = await this.chatService.getChatRoomByFriend(userId, data.friendId);
      }
      if (!room) {
        return;
      }

      const friendId = room.user1Id === userId ? room.user2Id : room.user1Id;
      const roomId = room._id.toString();
      this.server.to(`chat_user_${friendId}`).emit('chat_typing_stopped', {
        roomId,
        userId,
      });
    } catch (error: any) {
      client.emit('error', { message: error?.message ?? String(error) });
    }
  }
}
