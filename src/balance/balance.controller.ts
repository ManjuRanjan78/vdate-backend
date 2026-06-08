import { Controller, Get, Post, Body, Param, NotFoundException, BadRequestException, ParseIntPipe } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Controller('balance')
export class BalanceController {
  constructor(private usersService: UsersService) {}

  @Get(':userId')
  async getBalance(@Param('userId') userId: string) {
    const user = await this.usersService.findById(userId);
    return { balance: user?.coins || 0 };
  }

  @Post('update')
  async updateBalance(@Body() body: { userId: string; amount: number }) {
    const user = await this.usersService.findById(body.userId);
    if (!user) throw new NotFoundException('User not found');
    const newBalance = (user.coins || 0) + body.amount;
    await this.usersService.updateUser(body.userId, { coins: newBalance });
    return { newBalance };
  }

  @Post('transfer')
  async transferCoins(@Body() body: { fromUserId: string; toUserId: string; amount: number; description?: string }) {
    const fromUser = await this.usersService.findById(body.fromUserId);
    const toUser = await this.usersService.findById(body.toUserId);
    if (!fromUser || !toUser) throw new NotFoundException('User not found');
    if ((fromUser.coins || 0) < body.amount) throw new BadRequestException('Insufficient balance');
    const newFromBalance = (fromUser.coins || 0) - body.amount;
    const newToBalance = (toUser.coins || 0) + body.amount;
    await this.usersService.updateUser(body.fromUserId, { coins: newFromBalance });
    await this.usersService.updateUser(body.toUserId, { coins: newToBalance });
    return { success: true, newSenderBalance: newFromBalance };
  }
}