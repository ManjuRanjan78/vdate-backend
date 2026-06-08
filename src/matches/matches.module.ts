import { Module } from '@nestjs/common';

import { MatchesController }
  from './matches.controller';

import { MatchService }
  from './matches.service';

import { RedisModule }
  from '../redis/redis.module';

import { UsersModule }
  from '../users/users.module';

@Module({
  imports: [
    RedisModule,
    UsersModule,
  ],

  controllers: [
    MatchesController,
  ],

  providers: [
    MatchService,
  ],

  exports: [
    MatchService,
  ],
})
export class MatchesModule {}