import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Repository, In } from 'typeorm';
import { MessageTemplate } from './entities/message-template.entity';
import { User } from '../users/users.entity';
import { Friend, FriendStatus } from '../friends/entities/friend.entity';
import { Friendship } from '../friends/entities/friendship.entity';
import { RedisService } from '../redis/redis.service';
import { ChatRoom } from './schemas/chat-room.schema';
import { ChatMessage } from './schemas/chat-message.schema';

@Injectable()
export class ChatService implements OnModuleInit {
  constructor(
    @InjectModel(ChatRoom.name)
    private readonly chatRoomModel: Model<ChatRoom>,
    @InjectModel(ChatMessage.name)
    private readonly chatMessageModel: Model<ChatMessage>,
    @InjectRepository(MessageTemplate)
    private readonly templateRepo: Repository<MessageTemplate>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Friend)
    private readonly friendRepo: Repository<Friend>,
    @InjectRepository(Friendship)
    private readonly friendshipRepo: Repository<Friendship>,
    private readonly redisService: RedisService,
  ) {}

  async onModuleInit() {
    const count = await this.templateRepo.count();
    if (count === 0) {
      const predefinedPairs = [
        { message: 'Hi 👋', autoResponse: 'Hello 👋' },
        { message: 'Hello 👋', autoResponse: 'Hi 👋' },
        { message: 'How are you?', autoResponse: 'I\'m doing great! How about you?' },
        { message: 'I\'m doing great! How about you?', autoResponse: 'Great to hear! 😊' },
        { message: 'Nice to meet you 😊', autoResponse: 'Nice to meet you too! 😊' },
        { message: 'Nice to meet you too! 😊', autoResponse: 'Likewise! 😊' },
        { message: 'Want to video call?', autoResponse: 'Sure! Let\'s video call 📞' },
        { message: 'Sure! Let\'s video call 📞', autoResponse: 'Awesome! 🎥' },
        { message: 'Where are you from?', autoResponse: 'I\'m from [city], how about you?' },
        { message: 'Good morning ☀️', autoResponse: 'Good morning! 🌅' },
        { message: 'Good night 🌙', autoResponse: 'Good night! Sleep well 😴' },
        { message: 'You look amazing 😍', autoResponse: 'Thank you! 🥰' },
        { message: 'Thank you! 🥰', autoResponse: 'You\'re welcome 😊' },
        { message: 'Sure 👍', autoResponse: 'Perfect! 👍' },
        { message: 'Perfect! 👍', autoResponse: 'Great! 😊' },
        { message: 'Maybe later', autoResponse: 'No problem! Hit me up later 😊' },
        { message: 'No problem! Hit me up later 😊', autoResponse: 'Will do! 😊' },
        { message: 'Thank you 😊', autoResponse: 'You\'re welcome! 😊' },
        { message: 'Let\'s chat', autoResponse: 'I\'d love to! 💬' },
        { message: 'I\'d love to! 💬', autoResponse: 'Great! What\'s up?' },
        { message: 'Sounds good', autoResponse: 'Awesome! 😊' },
      ];

      const templates: MessageTemplate[] = [];
      let responseIndex = 0;

      // First pass: create all messages
      for (const pair of predefinedPairs) {
        const messageTemplate = this.templateRepo.create({
          message: pair.message,
          isAutoResponse: false,
        });
        templates.push(messageTemplate);
      }

      const savedTemplates = await this.templateRepo.save(templates);

      // Second pass: set auto-response references
      const templateMap = new Map<string, number>();
      savedTemplates.forEach((template) => {
        templateMap.set(template.message, template.id);
      });

      for (const pair of predefinedPairs) {
        const messageTemplate = templateMap.get(pair.message);
        const autoResponseId = templateMap.get(pair.autoResponse);

        if (messageTemplate && autoResponseId) {
          await this.templateRepo.update(
            { id: messageTemplate },
            { autoResponseId: autoResponseId },
          );
        }
      }
    }
  }

  async getPredefinedMessages() {
    return this.templateRepo.find({ where: { isActive: true } });
  }

  async isMutualFriend(user1Id: number, user2Id: number): Promise<boolean> {
    const u1 = Number(user1Id);
    const u2 = Number(user2Id);
    const [userA, userB] = u1 < u2 ? [u1, u2] : [u2, u1];
    const friendship = await this.friendshipRepo.findOne({
      where: {
        user1Id: userA,
        user2Id: userB,
      },
    });

    if (friendship) {
      return true;
    }

    const acceptedRequests = await this.friendRepo.find({
      where: [
        { senderId: user1Id, receiverId: user2Id, status: FriendStatus.ACCEPTED },
        { senderId: user2Id, receiverId: user1Id, status: FriendStatus.ACCEPTED },
      ],
    });

    return acceptedRequests.length > 0;
  }

  async isMatchedPair(user1Id: number, user2Id: number): Promise<boolean> {
    const matchedForUser1 = await this.redisService.getMatched(user1Id.toString());
    const matchedForUser2 = await this.redisService.getMatched(user2Id.toString());
    return matchedForUser1 === user2Id.toString() || matchedForUser2 === user1Id.toString();
  }

  async findRoomByPair(user1Id: number, user2Id: number) {
    const u1 = Number(user1Id);
    const u2 = Number(user2Id);
    return this.chatRoomModel.findOne({
      $or: [
        { user1Id: u1, user2Id: u2 },
        { user1Id: u2, user2Id: u1 },
      ],
    });
  }

  async getOrCreateChatRoom(user1Id: number, user2Id: number) {
    const u1 = Number(user1Id);
    const u2 = Number(user2Id);
    if (u1 === u2) {
      throw new BadRequestException('Cannot start a chat with yourself.');
    }

    const existingRoom = await this.findRoomByPair(u1, u2);
    if (existingRoom) {
      return existingRoom;
    }

    const mutualFriend = await this.isMutualFriend(u1, u2);
    const matchedPair = await this.isMatchedPair(u1, u2);
    if (!mutualFriend && !matchedPair) {
      throw new BadRequestException('You can only start a chat with a matched user or a mutual friend.');
    }

    const room = new this.chatRoomModel({
      user1Id: u1,
      user2Id: u2,
    });
    return await room.save();
  }

  async getChatRoomById(userId: number, roomId: string) {
    if (!Types.ObjectId.isValid(roomId)) {
      return null;
    }

    const room = await this.chatRoomModel.findById(roomId);
    if (!room) {
      return null;
    }

    if (room.user1Id !== userId && room.user2Id !== userId) {
      return null;
    }

    return room;
  }

  async getChatRooms(userId: number) {
    const uid = Number(userId);
    const rooms = await this.chatRoomModel
      .find({ $or: [{ user1Id: uid }, { user2Id: uid }] })
      .sort({ updatedAt: -1 });

    const friendIds = rooms.map((room) => {
      const u1 = Number(room.user1Id);
      const u2 = Number(room.user2Id);
      return u1 === uid ? u2 : u1;
    });
    const uniqueFriendIds = Array.from(new Set(friendIds));
    const friends = uniqueFriendIds.length > 0 ? await this.userRepo.findBy({ id: In(uniqueFriendIds) }) : [];
    const friendMap = new Map(friends.map((friend) => [friend.id, friend]));

    const result: any[] = [];
    for (const room of rooms) {
      const u1 = Number(room.user1Id);
      const u2 = Number(room.user2Id);
      const friendId = u1 === uid ? u2 : u1;
      const friend = friendMap.get(friendId);
      if (!friend) {
        continue;
      }

      const unreadCount = await this.chatMessageModel.countDocuments({
        roomId: room._id.toString(),
        receiverId: userId,
        $or: [{ readAt: null }, { readAt: { $exists: false } }],
      });

      result.push({
        roomId: room._id.toString(),
        friendId,
        friendName: friend.name || friend.email || 'Unknown',
        friendImage: friend.imageUrl || '',
        isOnline: friend.isOnline || false,
        lastMessage: room.lastMessage || '',
        lastMessageAt: room.lastMessageAt,
        unreadCount,
      });
    }

    return result;
  }

  async getUserName(userId: number): Promise<string> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    return user?.name || user?.email || 'Someone';
  }

  async getMessages(userId: number, roomId: string) {
    const room = await this.getChatRoomById(userId, roomId);
    if (!room) {
      throw new NotFoundException('Chat room not found');
    }

    const messages = await this.chatMessageModel
      .find({ roomId: room._id.toString() })
      .sort({ createdAt: 1 });

    const templates = await this.templateRepo.find();
    const templateMap = new Map(templates.map((template) => [template.id, template.message]));

    return messages.map((message) => {
      const templateMessage = message.predefinedMessageId != null
        ? templateMap.get(message.predefinedMessageId)
        : undefined;

      return {
        id: message._id.toString(),
        roomId: message.roomId,
        senderId: message.senderId,
        receiverId: message.receiverId,
        predefinedMessageId: message.predefinedMessageId,
        text: message.text,
        deliveredAt: message.deliveredAt,
        readAt: message.readAt,
        createdAt: message.createdAt,
        isSystem: message.isSystem || false,
        messageTemplate: templateMessage || message.text,
      };
    });
  }

  private getChatPolicyViolation(message: string): string | undefined {
    const trimmed = message.trim();
    if (!trimmed.length) {
      throw new BadRequestException('Message cannot be empty.');
    }

    const emailRegex = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/i;
    const phoneRegex = /(?:\+\d{1,3}[\s-.]*)?(?:\(\d{2,4}\)|\d{2,4})[\s-.]*\d{3,4}[\s-.]*\d{3,4}/;
    const urlRegex = /(?:https?:\/\/|www\.)[\w\-]+(?:\.[\w\-]+)+(?:[\w\-.,@?^=%&:/~+#]*[\w\-@?^=%&/~+#])?/i;
    const telegramRegex = /(?:t\.me\/[A-Za-z0-9_\.]+|telegram\.me\/[A-Za-z0-9_\.]+|@([A-Za-z0-9_\.]+))/i;
    const whatsappRegex = /(?:wa\.me\/[0-9]+|whatsapp\.[a-z]+\/[0-9]+|\+?\d{7,15})/i;
    const snapchatRegex = /(?:snapchat\.com\/add\/[A-Za-z0-9_]+|@([A-Za-z0-9_]+))/i;
    const instagramRegex = /(?:instagram\.com\/[A-Za-z0-9_\.]+|@([A-Za-z0-9_\.]+))/i;
    const contactHandleRegex = /(?:@(telegram|snapchat|instagram|whatsapp|tiktok)\b)/i;
    const contactPolicyMessage = "You're not allowed to share contact info - ⚠️ Personal contact information has been removed for safety.";

    if (emailRegex.test(message)
      || phoneRegex.test(message)
      || urlRegex.test(message)
      || telegramRegex.test(message)
      || whatsappRegex.test(message)
      || snapchatRegex.test(message)
      || instagramRegex.test(message)
      || contactHandleRegex.test(message)) {
      return contactPolicyMessage;
    }

    return undefined;
  }

  private async createSystemMessage(senderId: number, room: any, text: string) {
    const systemMessage = new this.chatMessageModel({
      roomId: room._id.toString(),
      senderId,
      receiverId: senderId,
      text,
      deliveredAt: new Date(),
      readAt: new Date(),
      isSystem: true,
    });

    await systemMessage.save();
    return systemMessage;
  }

  async getChatRoomByFriend(userId: number, friendId: number) {
    return this.findRoomByPair(userId, friendId);
  }

  async sendChatMessage(
    senderId: number,
    body: {
      roomId?: string;
      receiverId?: number;
      message?: string;
      messageTemplateId?: number;
      clientMessageId?: string;
    },
  ) {
    let room: any = null;
    if (body.roomId != null && body.roomId.trim().length > 0) {
      room = await this.getChatRoomById(senderId, body.roomId);
      if (!room) {
        throw new NotFoundException('Chat room not found');
      }
    }

    if (!room) {
      const receiverId = body.receiverId;
      if (receiverId == null) {
        throw new BadRequestException('receiverId is required when roomId is not provided.');
      }
      room = await this.getOrCreateChatRoom(senderId, receiverId);
    }

    const receiverId = room.user1Id === senderId ? room.user2Id : room.user1Id;
    let text = '';
    let predefinedMessageId: number | undefined;

    if (body.message != null && body.message.trim().length > 0) {
      const trimmedMessage = body.message.trim();
      const policyMessage = this.getChatPolicyViolation(trimmedMessage);
      if (policyMessage) {
        const systemMessage = await this.createSystemMessage(senderId, room, policyMessage);
        return {
          id: systemMessage._id.toString(),
          clientMessageId: body.clientMessageId,
          roomId: room._id.toString(),
          senderId,
          receiverId: senderId,
          predefinedMessageId: systemMessage.predefinedMessageId,
          text: systemMessage.text,
          deliveredAt: systemMessage.deliveredAt,
          readAt: systemMessage.readAt,
          createdAt: systemMessage.createdAt,
          isSystem: true,
          roomCreated: room.isNew === false ? false : true,
        };
      }
      text = trimmedMessage;
    } else if (body.messageTemplateId != null) {
      const template = await this.templateRepo.findOne({ where: { id: body.messageTemplateId, isActive: true } });
      if (!template) {
        throw new NotFoundException('Invalid message template.');
      }
      text = template.message;
      predefinedMessageId = body.messageTemplateId;
    } else {
      throw new BadRequestException('Either message or messageTemplateId is required.');
    }

    const chatMessage = new this.chatMessageModel({
      roomId: room._id.toString(),
      senderId,
      receiverId,
      predefinedMessageId,
      text,
      deliveredAt: new Date(),
    });
    await chatMessage.save();

    room.lastMessage = text;
    room.lastMessageAt = chatMessage.createdAt;
    await room.save();

    if (predefinedMessageId != null) {
      const template = await this.templateRepo.findOne({ where: { id: predefinedMessageId, isActive: true } });
      if (template?.autoResponseId) {
        const delayMs = 3000 + Math.random() * 2000;
        setTimeout(async () => {
          try {
            await this.sendAutoResponse(room._id.toString(), senderId, receiverId, template.autoResponseId);
          } catch (error) {
            console.error('Auto-response failed:', error);
          }
        }, delayMs);
      }
    }

    return {
      id: chatMessage._id.toString(),
      clientMessageId: body.clientMessageId,
      roomId: room._id.toString(),
      senderId,
      receiverId,
      predefinedMessageId: chatMessage.predefinedMessageId,
      text: chatMessage.text,
      deliveredAt: chatMessage.deliveredAt,
      readAt: chatMessage.readAt,
      createdAt: chatMessage.createdAt,
      isSystem: false,
      roomCreated: room.isNew === false ? false : true,
    };
  }

  async markAsRead(userId: number, roomId: string) {
    const room = await this.getChatRoomById(userId, roomId);
    if (!room) {
      return;
    }

    await this.chatMessageModel.updateMany(
      {
        roomId: room._id.toString(),
        receiverId: userId,
        $or: [{ readAt: null }, { readAt: { $exists: false } }],
      },
      { readAt: new Date() },
    );
  }

  private async sendAutoResponse(roomId: string, originalSenderId: number, originalReceiverId: number, autoResponseTemplateId: number) {
    try {
      const room = await this.chatRoomModel.findById(roomId);
      if (!room) return;

      const autoTemplate = await this.templateRepo.findOne({
        where: { id: autoResponseTemplateId, isActive: true },
      });
      if (!autoTemplate) return;

      // Send response from originalReceiverId to originalSenderId
      const autoMessage = new this.chatMessageModel({
        roomId: roomId,
        senderId: originalReceiverId,
        receiverId: originalSenderId,
        predefinedMessageId: autoResponseTemplateId,
        text: autoTemplate.message,
        isAutoResponse: true,
      });
      await autoMessage.save();

      room.lastMessage = autoTemplate.message;
      room.lastMessageAt = autoMessage.createdAt;
      await room.save();

      // Emit the auto-response to connected clients
      const socketService = require('../socket/socket.gateway');
      if (socketService && socketService.server) {
        socketService.server.emit('chat_message', {
          id: autoMessage._id.toString(),
          roomId: roomId,
          senderId: originalReceiverId,
          receiverId: originalSenderId,
          predefinedMessageId: autoResponseTemplateId,
          text: autoTemplate.message,
          readAt: autoMessage.readAt,
          createdAt: autoMessage.createdAt,
          isAutoResponse: true,
        });
      }
    } catch (error) {
      console.error('Error sending auto-response:', error);
    }
  }

  async getUnreadBadgeCount(userId: number) {
    return this.chatMessageModel.countDocuments({
      receiverId: userId,
      $or: [{ readAt: null }, { readAt: { $exists: false } }],
    });
  }
}
