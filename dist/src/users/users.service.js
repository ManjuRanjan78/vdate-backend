"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const users_entity_1 = require("./users.entity");
const redis_service_1 = require("../redis/redis.service");
let UsersService = class UsersService {
    userRepo;
    redisService;
    constructor(userRepo, redisService) {
        this.userRepo = userRepo;
        this.redisService = redisService;
    }
    async findByPhone(phone) {
        return this.userRepo.findOne({
            where: { phone },
        });
    }
    async findByEmail(email) {
        return this.userRepo.findOne({
            where: { email },
        });
    }
    async findById(id) {
        if (id === null ||
            id === undefined ||
            id === '') {
            console.log('[findById] Missing ID:', id);
            return null;
        }
        const userId = Number(id);
        if (isNaN(userId) ||
            userId <= 0) {
            console.log('[findById] Invalid ID:', id);
            return null;
        }
        return this.userRepo.findOne({
            where: {
                id: userId,
            },
        });
    }
    async createUser(data) {
        const user = this.userRepo.create(data);
        return this.userRepo.save(user);
    }
    async updateUser(id, updates) {
        const userId = Number(id);
        console.log('[updateUser]', userId);
        if (isNaN(userId) ||
            userId <= 0) {
            throw new Error(`Invalid user ID: ${id}`);
        }
        const user = await this.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        if (updates.dob) {
            const dob = new Date(updates.dob);
            const today = new Date();
            let age = today.getFullYear() -
                dob.getFullYear();
            const monthDiff = today.getMonth() -
                dob.getMonth();
            if (monthDiff < 0 ||
                (monthDiff === 0 &&
                    today.getDate() <
                        dob.getDate())) {
                age--;
            }
            if (age < 18) {
                throw new Error('This is an 18+ app');
            }
            updates.age = age;
        }
        if (updates.profileCompleted &&
            !user.profileCompleted) {
            updates.coins =
                (user.coins || 0) + 50;
        }
        await this.userRepo.update(userId, updates);
        return this.findById(userId);
    }
    async updateCoins(userId, amount) {
        const user = await this.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        const updatedCoins = Math.max(0, (user.coins || 0) + amount);
        await this.userRepo.update(Number(userId), {
            coins: updatedCoins,
        });
        return updatedCoins;
    }
    async setUserOnline(userId) {
        const user = await this.findById(userId);
        if (!user) {
            return;
        }
        const id = String(user.id);
        await this.redisService.sadd('online_users', id);
        if (user.gender?.toLowerCase() ===
            'male') {
            await this.redisService.sadd('online:male', id);
        }
        if (user.gender?.toLowerCase() ===
            'female') {
            await this.redisService.sadd('online:female', id);
        }
        await this.userRepo.update(user.id, {
            isOnline: true,
            lastActiveAt: new Date(),
        });
        console.log(`✅ User Online: ${id}`);
        console.log('ONLINE_STATE_CHANGED', {
            userId: id,
            isOnline: true,
        });
    }
    async setUserOffline(userId) {
        const user = await this.findById(userId);
        if (!user) {
            return;
        }
        const id = String(user.id);
        await this.redisService.srem('online_users', id);
        if (user.gender?.toLowerCase() ===
            'male') {
            await this.redisService.srem('online:male', id);
            await this.redisService.srem('online_calls:male', id);
        }
        if (user.gender?.toLowerCase() ===
            'female') {
            await this.redisService.srem('online:female', id);
            await this.redisService.srem('online_calls:female', id);
        }
        await this.userRepo.update(user.id, {
            isOnline: false,
            lastActiveAt: new Date(),
        });
        console.log(`❌ User Offline: ${id}`);
        console.log('ONLINE_STATE_CHANGED', {
            userId: id,
            isOnline: false,
        });
    }
    async getOnlineUsers() {
        const onlineUserIds = await this.redisService.smembers('online_users');
        console.log('REDIS ONLINE USERS:', onlineUserIds);
        if (!onlineUserIds ||
            onlineUserIds.length === 0) {
            console.log('Redis empty → loading from DB');
            return this.userRepo.find({
                where: {
                    isOnline: true,
                    profileCompleted: true,
                },
                select: [
                    'id',
                    'name',
                    'age',
                    'gender',
                    'imageUrl',
                    'city',
                    'coins',
                    'isOnline',
                    'country',
                    'bio',
                    'interests',
                    'isVerified',
                    'likesCount',
                    'followersCount',
                    'role',
                ],
            });
        }
        const ids = onlineUserIds
            .map((id) => Number(id))
            .filter((id) => !isNaN(id) &&
            id > 0);
        return this.userRepo.find({
            where: {
                id: (0, typeorm_2.In)(ids),
            },
            select: [
                'id',
                'name',
                'age',
                'gender',
                'imageUrl',
                'city',
                'coins',
                'isOnline',
                'country',
                'bio',
                'interests',
                'isVerified',
                'likesCount',
                'followersCount',
                'role',
            ],
        });
    }
    async getActiveLiveHosts() {
        return this.userRepo.find({
            where: {
                isLive: true,
            },
            select: [
                'id',
                'name',
                'age',
                'gender',
                'imageUrl',
                'city',
                'country',
                'coins',
                'isOnline',
                'viewerCount',
                'likesCount',
            ],
        });
    }
    async getRandomMatch(currentUserId) {
        const currentUser = await this.findById(currentUserId);
        if (!currentUser) {
            throw new Error('User not found');
        }
        if (!currentUser.isActive) {
            throw new Error('User inactive');
        }
        let targetGender = '';
        if (currentUser.gender
            ?.toLowerCase() ===
            'male') {
            targetGender =
                'female';
        }
        if (currentUser.gender
            ?.toLowerCase() ===
            'female') {
            targetGender =
                'male';
        }
        const onlineUsers = await this.redisService.smembers(`online:${targetGender}`);
        const filteredUsers = [];
        for (const id of onlineUsers) {
            if (Number(id) ===
                currentUserId) {
                continue;
            }
            const busy = await this.redisService.isBusy(id);
            if (busy) {
                continue;
            }
            const matched = await this.redisService.getMatched(id);
            if (matched) {
                continue;
            }
            filteredUsers.push(id);
        }
        if (filteredUsers.length === 0) {
            return null;
        }
        const randomUserId = filteredUsers[Math.floor(Math.random() *
            filteredUsers.length)];
        return this.findById(Number(randomUserId));
    }
    async getPublicProfile(userId) {
        if (isNaN(userId) ||
            userId <= 0) {
            console.log('[getPublicProfile] Invalid user ID:', userId);
            return null;
        }
        return this.userRepo.findOne({
            where: {
                id: userId,
            },
            select: [
                'id',
                'name',
                'age',
                'gender',
                'imageUrl',
                'bio',
                'city',
                'country',
                'isOnline',
                'isVerified',
            ],
        });
    }
    async setUserOnlineForCalls(userId) {
        const user = await this.findById(userId);
        if (!user)
            return;
        const id = String(user.id);
        await this.redisService.sadd('online_users', id);
        const gender = user.gender?.toLowerCase();
        if (gender) {
            await this.redisService.sadd(`online_calls:${gender}`, id);
        }
        await this.userRepo.update(user.id, {
            isOnline: true,
            lastActiveAt: new Date(),
        });
        console.log(`✅ User Online for Calls: ${id}`);
        console.log('ONLINE_STATE_CHANGED', {
            userId: id,
            isOnline: true,
        });
    }
    async setUserOfflineForCalls(userId) {
        const user = await this.findById(userId);
        if (!user)
            return;
        const id = String(user.id);
        const gender = user.gender?.toLowerCase();
        if (gender) {
            await this.redisService.srem(`online_calls:${gender}`, id);
        }
        console.log(`❌ User Offline for Calls: ${id}`);
        console.log('ONLINE_STATE_CHANGED', {
            userId: id,
            isOnline: false,
        });
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(users_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        redis_service_1.RedisService])
], UsersService);
//# sourceMappingURL=users.service.js.map