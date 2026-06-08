import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Req,
  UnauthorizedException,
} from '@nestjs/common';

import { FriendsService } from './friends.service';

@Controller('friends')
export class FriendsController {
  constructor(
    private readonly friendsService:
      FriendsService,
  ) {}

  // =========================
  // SEND REQUEST
  // =========================

  @Post('request')
  async sendFriendRequest(
    @Req() req: any,
    @Body()
    body: {
      senderId?: number;
      receiverId: number;
    },
  ) {
    const senderId = req.user?.userId || Number(body.senderId);
    return this.friendsService.sendFriendRequest(
      Number(senderId),
      Number(body.receiverId),
    );
  }

  // =========================
  // ACCEPT REQUEST
  // =========================

  @Post('accept')
  async acceptFriendRequest(
    @Body()
    body: {
      requestId: number;
    },
  ) {
    return this.friendsService.acceptFriendRequest(
      body.requestId,
    );
  }

  // =========================
  // REJECT REQUEST
  // =========================

  @Post('reject')
  async rejectFriendRequest(
    @Body()
    body: {
      requestId: number;
    },
  ) {
    return this.friendsService.rejectFriendRequest(
      body.requestId,
    );
  }

  // =========================
  // ACCEPT REQUEST BY USERS
  // =========================

  @Post('accept-by-users')
  async acceptFriendRequestByUsers(
    @Body()
    body: {
      acceptorId: number;
      requesterId: number;
    },
  ) {
    return this.friendsService.acceptFriendRequestByUsers(
      Number(body.acceptorId),
      Number(body.requesterId),
    );
  }

  // =========================
  // REJECT REQUEST BY USERS
  // =========================

  @Post('reject-by-users')
  async rejectFriendRequestByUsers(
    @Body()
    body: {
      rejectorId: number;
      requesterId: number;
    },
  ) {
    return this.friendsService.rejectFriendRequestByUsers(
      Number(body.rejectorId),
      Number(body.requesterId),
    );
  }

  // =========================
  // MUTUAL FRIENDS
  // =========================

  @Get('mutual')
  async getMutualFriends(@Req() req: any) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException();
    }
    return this.friendsService.getMutualFriends(Number(userId));
  }

  // =========================
  // FRIEND LIST
  // =========================

  @Get('list/:userId')
  async getFriends(
    @Param('userId')
    userId: string,
  ) {
    return this.friendsService.getFriends(
      Number(userId),
    );
  }

  // =========================
  // PENDING REQUESTS
  // =========================

  @Get('pending/:userId')
  async getPendingRequests(
    @Param('userId')
    userId: string,
  ) {
    return this.friendsService.getPendingRequests(
      Number(userId),
    );
  }

  // =========================
  // FRIEND STATUS
  // =========================

  @Get('status/:userId/:otherUserId')
  async getFriendStatus(
    @Param('userId')
    userId: string,
    @Param('otherUserId')
    otherUserId: string,
  ) {
    return this.friendsService.getFriendStatus(
      Number(userId),
      Number(otherUserId),
    );
  }
}