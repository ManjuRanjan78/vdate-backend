import { Module } from '@nestjs/common';
import { BalanceController } from './balance.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [BalanceController],
})
export class BalanceModule {}