import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { RedisService } from './src/redis/redis.service';
import { UsersService } from './src/users/users.service';
import { io as ioClient } from 'socket.io-client';

async function bootstrap() {
  // 1. Start NestJS server on port 8001 (to avoid conflict if 8000 is running)
  process.env.PORT = '8001';
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  await app.listen(8001, '0.0.0.0');
  console.log('🚀 Server started on port 8001');

  const redisService = app.get(RedisService);
  const usersService = app.get(UsersService);

  // 2. Prepare database users
  let userA = await usersService.findByPhone('1111111111');
  if (!userA) {
    userA = await usersService.createUser({
      phone: '1111111111',
      name: 'User A (Female)',
      gender: 'female',
      isActive: true,
      isOnline: true,
      coins: 1000,
    });
  } else {
    await usersService.updateUser(userA.id, { gender: 'female', isActive: true, isOnline: true, coins: 1000 });
  }

  let userB = await usersService.findByPhone('2222222222');
  if (!userB) {
    userB = await usersService.createUser({
      phone: '2222222222',
      name: 'User B (Female)',
      gender: 'female',
      isActive: true,
      isOnline: true,
      coins: 1000,
    });
  } else {
    await usersService.updateUser(userB.id, { gender: 'female', isActive: true, isOnline: true, coins: 1000 });
  }

  const uAId = String(userA.id);
  const uBId = String(userB.id);

  // Clean Redis keys
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
  await redisService.del(`history:${uAId}:${uBId}`);
  await redisService.del(`history:${uBId}:${uAId}`);

  console.log('--- CONNECTING SOCKET CLIENTS ---');

  const socketA = ioClient('http://localhost:8001', {
    query: { userId: uAId, gender: 'female' },
    transports: ['websocket'],
  });

  const socketB = ioClient('http://localhost:8001', {
    query: { userId: uBId, gender: 'female' },
    transports: ['websocket'],
  });

  let matchFoundA = false;
  let matchFoundB = false;

  socketA.on('match_found', (data) => {
    console.log('User A match_found:', data);
    matchFoundA = true;
  });

  socketB.on('match_found', (data) => {
    console.log('User B match_found:', data);
    matchFoundB = true;
  });

  socketA.on('match_error', (err) => {
    console.log('User A match_error:', err);
  });

  socketB.on('match_error', (err) => {
    console.log('User B match_error:', err);
  });

  socketA.on('waiting', (msg) => {
    console.log('User A waiting:', msg);
  });

  socketB.on('waiting', (msg) => {
    console.log('User B waiting:', msg);
  });

  // Wait for sockets to connect, then emit find_match
  setTimeout(() => {
    console.log('\n--- EMITTING find_match for User B (Female, Preference=Female) ---');
    socketB.emit('find_match', {
      userId: uBId,
      gender: 'female',
      preferenceGender: 'female',
      preferenceLocation: 'Global',
    });
  }, 2000);

  setTimeout(() => {
    console.log('\n--- EMITTING find_match for User A (Female, Preference=Female) ---');
    socketA.emit('find_match', {
      userId: uAId,
      gender: 'female',
      preferenceGender: 'female',
      preferenceLocation: 'Global',
    });
  }, 4000);

  setTimeout(async () => {
    console.log('\n--- CHECKING RESULTS ---');
    if (matchFoundA && matchFoundB) {
      console.log('✅ SUCCESS: Both users matched over WebSockets!');
    } else {
      console.log('❌ FAILURE: Sockets failed to match!');
    }

    socketA.disconnect();
    socketB.disconnect();
    await app.close();
    process.exit(0);
  }, 8000);
}

bootstrap();
