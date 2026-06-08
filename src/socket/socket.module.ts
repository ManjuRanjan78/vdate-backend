import { Module, forwardRef } from '@nestjs/common';

import { SocketGateway } from './socket.gateway';

import { UsersModule } from '../users/users.module';
import { ChatModule } from '../chat/chat.module';

import { RedisModule } from '../redis/redis.module';

import { MatchesModule } from '../matches/matches.module';
import { FriendsModule } from '../friends/friends.module';
import { CallsModule } from '../calls/calls.module';
import { LivekitModule } from '../livekit/livekit.module';
import { FirebaseModule } from '../firebase/firebase.module';

@Module({
  imports: [
    UsersModule,
    forwardRef(() => ChatModule),
    RedisModule,
    MatchesModule,
    forwardRef(() => FriendsModule),
    CallsModule,
    LivekitModule,
    FirebaseModule,
  ],

  providers: [SocketGateway],

  exports: [SocketGateway],
})
export class SocketModule {}