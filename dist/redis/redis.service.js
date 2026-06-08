"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const redis_1 = require("redis");
let RedisService = class RedisService {
    client;
    async onModuleInit() {
        this.client = (0, redis_1.createClient)({
            url: 'redis://localhost:6379',
            socket: {
                reconnectStrategy: (retries) => {
                    if (retries > 10) {
                        return new Error('Redis reconnect failed');
                    }
                    return Math.min(retries * 100, 3000);
                },
            },
        });
        this.client.on('connect', () => {
            console.log('🔄 Redis Connecting...');
        });
        this.client.on('ready', () => {
            console.log('✅ Redis Ready');
        });
        this.client.on('error', (err) => {
            console.log('❌ Redis Error:', err);
        });
        this.client.on('reconnecting', () => {
            console.log('♻️ Redis Reconnecting...');
        });
        await this.client.connect();
        console.log('✅ Redis Connected');
    }
    async onModuleDestroy() {
        try {
            if (this.client?.isOpen) {
                await this.client.quit();
            }
        }
        catch (e) {
            console.log('Redis quit error:', e);
        }
        console.log('🛑 Redis Disconnected');
    }
    async set(key, value, ttlSeconds) {
        const stringValue = value === undefined
            ? null
            : JSON.stringify(value);
        if (stringValue == null) {
            return;
        }
        if (ttlSeconds) {
            await this.client.set(key, stringValue, {
                EX: ttlSeconds,
            });
            return;
        }
        await this.client.set(key, stringValue);
    }
    async get(key) {
        try {
            const data = await this.client.get(key);
            if (!data) {
                return null;
            }
            try {
                return JSON.parse(data);
            }
            catch (_) {
                return data;
            }
        }
        catch (e) {
            console.log(`Redis GET error: ${key}`, e);
            return null;
        }
    }
    async del(key) {
        await this.client.del(key);
    }
    async exists(key) {
        return await this.client.exists(key);
    }
    async sadd(key, value) {
        await this.client.sAdd(key, value);
    }
    async srem(key, value) {
        await this.client.sRem(key, value);
    }
    async smembers(key) {
        return await this.client.sMembers(key);
    }
    async addOnlineUser(userId, gender) {
        await this.sadd('online_users', userId);
        if (gender) {
            const normalizedGender = gender.toLowerCase();
            await this.sadd(`online:${normalizedGender}`, userId);
        }
        console.log(`✅ User Online: ${userId}`);
        console.log('REDIS ONLINE USERS:', await this.smembers('online_users'));
    }
    async getOnlineUsers() {
        return await this.smembers('online_users');
    }
    async removeOnlineUser(userId) {
        await this.srem('online_users', userId);
        await this.srem('online:male', userId);
        await this.srem('online:female', userId);
        console.log(` User Offline: ${userId}`);
        await this.del(`socket:${userId}`);
    }
    async setBusy(userId) {
        await this.set(`busy:${userId}`, true, 120);
    }
    async removeBusy(userId) {
        await this.del(`busy:${userId}`);
    }
    async isBusy(userId) {
        return await this.get(`busy:${userId}`);
    }
    async setMatched(userId, peerId) {
        await this.set(`matched:${userId}`, peerId, 120);
    }
    async getMatched(userId) {
        return await this.get(`matched:${userId}`);
    }
    async clearMatched(userId) {
        const peerId = await this.getMatched(userId);
        await this.del(`matched:${userId}`);
        if (peerId) {
            await this.del(`matched:${peerId}`);
        }
    }
    async getNextAvailableUser(currentUserId) {
        const users = await this.getOnlineUsers();
        for (const userId of users) {
            if (userId === currentUserId) {
                continue;
            }
            const busy = await this.isBusy(userId);
            if (busy) {
                continue;
            }
            const matched = await this.getMatched(userId);
            if (matched) {
                continue;
            }
            const socketId = await this.get(`socket:${userId}`);
            if (!socketId) {
                await this.srem('online_users', userId);
                await this.srem('online:male', userId);
                await this.srem('online:female', userId);
                await this.del(`socket:${userId}`);
                continue;
            }
            return userId;
        }
        return null;
    }
    async clearMatchPair(userId1, userId2) {
        await this.clearMatched(userId1);
        await this.removeBusy(userId1);
        await this.removeBusy(userId2);
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = __decorate([
    (0, common_1.Injectable)()
], RedisService);
//# sourceMappingURL=redis.service.js.map