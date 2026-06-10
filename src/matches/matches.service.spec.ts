import { Test, TestingModule } from '@nestjs/testing';
import { MatchService } from './matches.service';
import { RedisService } from '../redis/redis.service';
import { UsersService } from '../users/users.service';

describe('MatchService Integration Tests', () => {
  let service: MatchService;
  let redisStore: Record<string, any>;
  let userStore: Record<string, any>;

  beforeEach(async () => {
    redisStore = {};
    userStore = {};

    const mockRedisService = {
      get: jest.fn().mockImplementation((key: string) => {
        const val = redisStore[key];
        if (val === undefined) return null;
        try {
          return JSON.parse(val);
        } catch (_) {
          return val;
        }
      }),
      set: jest.fn().mockImplementation((key: string, val: any, ttl?: number) => {
        redisStore[key] = val === undefined ? null : JSON.stringify(val);
      }),
      del: jest.fn().mockImplementation((key: string) => {
        delete redisStore[key];
      }),
      sadd: jest.fn().mockImplementation((key: string, val: string) => {
        if (!redisStore[key]) redisStore[key] = [];
        const set = new Set(redisStore[key]);
        set.add(val);
        redisStore[key] = Array.from(set);
      }),
      srem: jest.fn().mockImplementation((key: string, val: string) => {
        if (!redisStore[key]) return;
        const set = new Set(redisStore[key]);
        set.delete(val);
        redisStore[key] = Array.from(set);
      }),
      smembers: jest.fn().mockImplementation((key: string) => {
        return redisStore[key] || [];
      }),
      isBusy: jest.fn().mockReturnValue(false),
      getMatched: jest.fn().mockReturnValue(null),
      hasMatchHistory: jest.fn().mockReturnValue(false),
      clearQueuePreferences: jest.fn(),
    };

    const mockUsersService = {
      findById: jest.fn().mockImplementation((id: any) => {
        return userStore[String(id)] || null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchService,
        { provide: RedisService, useValue: mockRedisService },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    service = module.get<MatchService>(MatchService);
  });

  // CASE 1: Male(default) ↔ Female(default) -> PASS
  it('CASE 1: should match Male(default) ↔ Female(default)', async () => {
    const userBId = '2';
    userStore[userBId] = { id: 2, gender: 'female' };
    await service.addToQueue(userBId, 'female', null);
    redisStore[`socket:${userBId}`] = JSON.stringify('socket_for_2');

    const userAId = '1';
    userStore[userAId] = { id: 1, gender: 'male' };

    const match = await service.getMatch(userAId, 'male', null);
    expect(match).toBe(userBId);
  });

  // CASE 2: Female(Female) ↔ Female(Female) -> PASS
  it('CASE 2: should match Female(Female) ↔ Female(Female)', async () => {
    const userBId = '2';
    userStore[userBId] = { id: 2, gender: 'female' };
    await service.addToQueue(userBId, 'female', 'female');
    redisStore[`socket:${userBId}`] = JSON.stringify('socket_for_2');

    const userAId = '1';
    userStore[userAId] = { id: 1, gender: 'female' };

    const match = await service.getMatch(userAId, 'female', 'female');
    expect(match).toBe(userBId);
  });

  // CASE 3: Male(Male) ↔ Male(Male) -> PASS
  it('CASE 3: should match Male(Male) ↔ Male(Male)', async () => {
    const userBId = '2';
    userStore[userBId] = { id: 2, gender: 'male' };
    await service.addToQueue(userBId, 'male', 'male');
    redisStore[`socket:${userBId}`] = JSON.stringify('socket_for_2');

    const userAId = '1';
    userStore[userAId] = { id: 1, gender: 'male' };

    const match = await service.getMatch(userAId, 'male', 'male');
    expect(match).toBe(userBId);
  });

  // CASE 4: Female(Female) ↔ Female(default) -> FAIL
  it('CASE 4: should NOT match Female(Female) ↔ Female(default)', async () => {
    const userBId = '2';
    userStore[userBId] = { id: 2, gender: 'female' };
    await service.addToQueue(userBId, 'female', null);
    redisStore[`socket:${userBId}`] = JSON.stringify('socket_for_2');

    const userAId = '1';
    userStore[userAId] = { id: 1, gender: 'female' };

    const match = await service.getMatch(userAId, 'female', 'female');
    expect(match).toBeNull();
  });

  // CASE 5: Male(Male) ↔ Male(default) -> FAIL
  it('CASE 5: should NOT match Male(Male) ↔ Male(default)', async () => {
    const userBId = '2';
    userStore[userBId] = { id: 2, gender: 'male' };
    await service.addToQueue(userBId, 'male', null);
    redisStore[`socket:${userBId}`] = JSON.stringify('socket_for_2');

    const userAId = '1';
    userStore[userAId] = { id: 1, gender: 'male' };

    const match = await service.getMatch(userAId, 'male', 'male');
    expect(match).toBeNull();
  });
});
