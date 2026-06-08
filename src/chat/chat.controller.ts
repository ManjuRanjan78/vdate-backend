import { Controller, Get, Post, Body, Param, Req, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('predefined-messages')
  getPredefinedMessages() {
    return this.chatService.getPredefinedMessages();
  }

  @Get('rooms')
  async getChatRooms(@Req() req: any) {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedException();
    return this.chatService.getChatRooms(Number(userId));
  }

  @Get('conversations')
  async getConversations(@Req() req: any) {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedException();
    return this.chatService.getChatRooms(Number(userId));
  }

  @Get('messages/:roomId')
  async getMessages(@Req() req: any, @Param('roomId') roomId: string) {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedException();

    let resolvedRoomId = roomId;
    if (!Types.ObjectId.isValid(roomId)) {
      const friendId = Number(roomId);
      if (!Number.isNaN(friendId)) {
        const room = await this.chatService.findRoomByPair(Number(userId), friendId);
        if (room) {
          resolvedRoomId = room._id.toString();
        }
      }
    }

    return this.chatService.getMessages(Number(userId), resolvedRoomId);
  }

  @Post('send-predefined')
  async sendPredefined(
    @Req() req: any,
    @Body()
    body: {
      roomId?: string;
      receiverId?: string;
      messageTemplateId: string;
    },
  ) {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedException();

    if ((body.roomId == null || body.roomId.trim() === '') && !body.receiverId) {
      throw new BadRequestException('roomId or receiverId is required.');
    }

    return this.chatService.sendChatMessage(Number(userId), {
      roomId: body.roomId,
      receiverId: body.receiverId != null ? Number(body.receiverId) : undefined,
      messageTemplateId: Number(body.messageTemplateId),
    });
  }

  @Post('send')
  async sendMessage(
    @Req() req: any,
    @Body()
    body: { roomId?: string; receiverId?: string; message?: string },
  ) {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedException();
    if ((body.roomId == null || body.roomId.trim() == '') && !body.receiverId) {
      throw new BadRequestException('roomId or receiverId is required.');
    }
    return this.chatService.sendChatMessage(Number(userId), {
      roomId: body.roomId,
      receiverId: body.receiverId != null ? Number(body.receiverId) : undefined,
      message: body.message,
    });
  }

  @Post('mark-read')
  async markAsRead(
    @Req() req: any,
    @Body()
    body: { roomId?: string; friendId?: string },
  ) {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedException();
    let roomId = body.roomId;
    if (!roomId && body.friendId) {
      const friendId = Number(body.friendId);
      if (!Number.isNaN(friendId)) {
        const room = await this.chatService.findRoomByPair(Number(userId), friendId);
        if (room) {
          roomId = room._id.toString();
        }
      }
    }
    if (!roomId) {
      throw new BadRequestException('roomId or friendId is required.');
    }
    await this.chatService.markAsRead(Number(userId), roomId);
    return { success: true };
  }
}
