"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./src/app.module");
const redis_service_1 = require("./src/redis/redis.service");
const users_service_1 = require("./src/users/users.service");
const socket_io_client_1 = require("socket.io-client");
async function bootstrap() {
    process.env.PORT = '8001';
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.setGlobalPrefix('api');
    await app.listen(8001, '0.0.0.0');
    console.log('🚀 Server started on port 8001');
    const redisService = app.get(redis_service_1.RedisService);
    const usersService = app.get(users_service_1.UsersService);
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
    }
    else {
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
    }
    else {
        await usersService.updateUser(userB.id, { gender: 'female', isActive: true, isOnline: true, coins: 1000 });
    }
    const uAId = String(userA.id);
    const uBId = String(userB.id);
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
    const socketA = (0, socket_io_client_1.io)('http://localhost:8001', {
        query: { userId: uAId, gender: 'female' },
        transports: ['websocket'],
    });
    const socketB = (0, socket_io_client_1.io)('http://localhost:8001', {
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
        }
        else {
            console.log('❌ FAILURE: Sockets failed to match!');
        }
        socketA.disconnect();
        socketB.disconnect();
        await app.close();
        process.exit(0);
    }, 8000);
}
bootstrap();
//# sourceMappingURL=test_matchmaking_socket.js.map