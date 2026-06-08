import { Controller, Get, Post, Body, Req } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('user')
export class UsersFeedController {
  constructor(private usersService: UsersService) {}

  @Get('feed')
  async getFeed(@Req() req: any) {
    const onlineUsers = await this.usersService.getOnlineUsers();
    return { data: onlineUsers.map(user => this.transformUserResponse(user)) };
  }

  @Post('online-status')
  async updateOnlineStatus(@Body() body: { isOnline: boolean }, @Req() req: any) {
    const userId = req.user.userId;
    await this.usersService.updateUser(userId, { isOnline: body.isOnline });
    return { success: true };
  }

  private transformUserResponse(user: any) {
    if (!user) return null;

    const response = { ...user };
    // Map dob to dateOfBirth
    if (user.dob) {
      response.dateOfBirth = user.dob;
    }
    return response;
  }
}