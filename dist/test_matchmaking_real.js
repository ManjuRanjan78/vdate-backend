"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./src/app.module");
const matches_service_1 = require("./src/matches/matches.service");
const redis_service_1 = require("./src/redis/redis.service");
const users_service_1 = require("./src/users/users.service");
async function bootstrap() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const matchService = app.get(matches_service_1.MatchService);
    const redisService = app.get(redis_service_1.RedisService);
    const usersService = app.get(users_service_1.UsersService);
    console.log('--- START MATCHMAKING TEST ---');
    try {
        let userA = await usersService.findByPhone('1111111111');
        if (!userA) {
            userA = await usersService.createUser({
                phone: '1111111111',
                name: 'User A (Male)',
                gender: 'male',
                isActive: true,
                isOnline: true,
            });
        }
        else {
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
        }
        else {
            await usersService.updateUser(userB.id, { gender: 'male', isActive: true, isOnline: true });
        }
        const uAId = String(userA.id);
        const uBId = String(userB.id);
        console.log(`User A: ID=${uAId}, Gender=${userA.gender}`);
        console.log(`User B: ID=${uBId}, Gender=${userB.gender}`);
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
        await redisService.sadd('online_users', uAId);
        await redisService.sadd('online_users', uBId);
        await redisService.sadd('online:male', uAId);
        await redisService.sadd('online:male', uBId);
        await redisService.set(`socket:${uAId}`, 'mock_socket_A');
        await redisService.set(`socket:${uBId}`, 'mock_socket_B');
        console.log('\n--- User B joins queue ---');
        await matchService.addToQueue(uBId, 'male', 'male');
        const uBPreference = await matchService.getQueuePreferenceGender(uBId);
        console.log(`User B preference in Redis: ${uBPreference}`);
        const maleQueue = await redisService.smembers('male_waiting');
        console.log('Male waiting queue:', maleQueue);
        console.log('\n--- User A searches for match ---');
        const matchedUserId = await matchService.getMatch(uAId, 'male', 'male');
        console.log('Match result:', matchedUserId);
        if (matchedUserId) {
            console.log(`\n✅ SUCCESS: User A matched with User B (ID: ${matchedUserId})`);
        }
        else {
            console.log('\n❌ FAILURE: No match was found!');
        }
    }
    catch (error) {
        console.error('Test error:', error);
    }
    finally {
        await app.close();
    }
}
bootstrap();
//# sourceMappingURL=test_matchmaking_real.js.map