import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { MatchService } from './src/matches/matches.service';
import { RedisService } from './src/redis/redis.service';
import { UsersService } from './src/users/users.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const matchService = app.get(MatchService);
  const redisService = app.get(RedisService);
  const usersService = app.get(UsersService);

  console.log('--- START MATCHMAKING TEST ---');

  try {
    // 1. Create or retrieve User A and User B
    let userA = await usersService.findByPhone('1111111111');
    if (!userA) {
      userA = await usersService.createUser({
        phone: '1111111111',
        name: 'User A (Male)',
        gender: 'male',
        isActive: true,
        isOnline: true,
      });
    } else {
      await usersService.updateUser(userA.id, { gender: 'male', isActive: true, isOnline: true });
    }

    let userB = await usersService.findByPhone('2222222222');
    if (!userB) {
      userB = await usersService.createUser({
        phone: '2222222222',
        name: 'User B (Male)',
        gender: 'male',
        isActive: true,
        isOnline: true,
      });
    } else {
      await usersService.updateUser(userB.id, { gender: 'male', isActive: true, isOnline: true });
    }

    const uAId = String(userA.id);
    const uBId = String(userB.id);

    console.log(`User A: ID=${uAId}, Gender=${userA.gender}`);
    console.log(`User B: ID=${uBId}, Gender=${userB.gender}`);

    // Clean up queues and match keys from previous runs
    await redisService.del('male_waiting');
    await redisService.del('female_waiting');
    await redisService.del(`queue:${uAId}`);
    await redisService.del(`queue:${uBId}`);
    await redisService.del(`socket:${uAId}`);
    await redisService.del(`socket:${uBId}`);
    await redisService.del(`busy:${uAId}`);
    await redisService.del(`busy:${uBId}`);
    await redisService.del(`matched:${uAId}`);
    await redisService.del(`matched:${uBId}`);
    await redisService.del(`queue_preference_gender:${uAId}`);
    await redisService.del(`queue_preference_gender:${uBId}`);

    // Set online statuses
    await redisService.sadd('online_users', uAId);
    await redisService.sadd('online_users', uBId);
    await redisService.sadd('online:male', uAId);
    await redisService.sadd('online:male', uBId);
    await redisService.set(`socket:${uAId}`, 'mock_socket_A');
    await redisService.set(`socket:${uBId}`, 'mock_socket_B');

    // Simulate User B adding himself to the queue
    // Gender = male, preference = male
    console.log('\n--- User B joins queue ---');
    await matchService.addToQueue(uBId, 'male', 'male');
    const uBPreference = await matchService.getQueuePreferenceGender(uBId);
    console.log(`User B preference in Redis: ${uBPreference}`);

    // Verify User B is in the queue
    const maleQueue = await redisService.smembers('male_waiting');
    console.log('Male waiting queue:', maleQueue);

    // Simulate User A calling getMatch
    // Gender = male, preference = male
    console.log('\n--- User A searches for match ---');
    const matchedUserId = await matchService.getMatch(uAId, 'male', 'male');
    console.log('Match result:', matchedUserId);

    if (matchedUserId) {
      console.log(`\n✅ SUCCESS: User A matched with User B (ID: ${matchedUserId})`);
    } else {
      console.log('\n❌ FAILURE: No match was found!');
    }

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
