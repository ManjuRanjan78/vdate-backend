import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { CallsController } from './calls.controller';
import { CallsService } from './calls.service';

import { RedisModule } from '../redis/redis.module';

import { User } from '../users/users.entity';

import { CallHistoryModule } from '../call-history/call-history.module';

@Module({
  imports: [
    RedisModule,
    CallHistoryModule,

    TypeOrmModule.forFeature([
      User,
    ]),
  ],

  controllers: [CallsController],

  providers: [CallsService],

  exports: [CallsService],
})
export class CallsModule {}