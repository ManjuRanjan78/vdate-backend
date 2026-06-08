import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CallHistoryController } from './call-history.controller';
import { CallHistoryService } from './call-history.service';
import { CallHistoryGateway } from './call-history.gateway';
import { CallHistory } from './call-history.entity';
import { User } from '../users/users.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CallHistory, User]),
  ],
  controllers: [CallHistoryController],
  providers: [CallHistoryService, CallHistoryGateway],
  exports: [CallHistoryService],
})
export class CallHistoryModule {}
