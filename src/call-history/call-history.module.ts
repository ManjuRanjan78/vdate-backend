import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CallHistoryController } from './call-history.controller';
import { CallHistoryService } from './call-history.service';
import { CallHistoryGateway } from './call-history.gateway';
import { CallHistory, CallHistorySchema } from './call-history.schema';
import { User } from '../users/users.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: CallHistory.name, schema: CallHistorySchema }]),
    TypeOrmModule.forFeature([User]),
  ],
  controllers: [CallHistoryController],
  providers: [CallHistoryService, CallHistoryGateway],
  exports: [CallHistoryService],
})
export class CallHistoryModule {}
