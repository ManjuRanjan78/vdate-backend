import { Test, TestingModule } from '@nestjs/testing';
import { SocketGateway } from './socket.gateway';
import { RedisService } from '../redis/redis.service';
import { UsersService } from '../users/users.service';
import { MatchService } from '../matches/matches.service';
import { FriendsService } from '../friends/friends.service';
import { CallsService } from '../calls/calls.service';
import { LivekitService } from '../livekit/livekit.service';
import { FirebaseService } from '../firebase/firebase.service';
import { ChatService } from '../chat/chat.service';

describe('SocketGateway', () => {
  let gateway: SocketGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SocketGateway,
        { provide: RedisService, useValue: {} },
        { provide: UsersService, useValue: {} },
        { provide: MatchService, useValue: {} },
        { provide: FriendsService, useValue: {} },
        { provide: CallsService, useValue: {} },
        { provide: LivekitService, useValue: {} },
        { provide: FirebaseService, useValue: {} },
        { provide: ChatService, useValue: {} },
      ],
    }).compile();

    gateway = module.get<SocketGateway>(SocketGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
