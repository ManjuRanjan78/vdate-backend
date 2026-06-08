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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchService = void 0;
const common_1 = require("@nestjs/common");
const redis_service_1 = require("../redis/redis.service");
const users_service_1 = require("../users/users.service");
let MatchService = class MatchService {
    redisService;
    usersService;
    constructor(redisService, usersService) {
        this.redisService = redisService;
        this.usersService = usersService;
    }
    async addToQueue(userId, gender) {
        gender =
            gender?.toLowerCase();
        if (gender !== 'male' &&
            gender !== 'female') {
            console.log(`Invalid gender: ${gender}`);
            return;
        }
        const queue = gender === 'male'
            ? 'male_waiting'
            : 'female_waiting';
        const users = await this.redisService.smembers(queue);
        if (users.includes(userId)) {
            await this.redisService.set(`queue:${userId}`, 'true', 60);
            console.log(`User already in queue: ${userId}`);
            return;
        }
        await this.redisService.sadd(queue, userId);
        await this.redisService.set(`queue:${userId}`, 'true', 60);
        console.log(`➕ Added To Queue: ${userId}`);
    }
    async getMatch(currentUserId, gender, preferenceGender, preferenceLocation) {
        await this.redisService.set(`queue:${currentUserId}`, 'true', 60);
        const currentUserBusy = await this.redisService.isBusy(currentUserId);
        if (currentUserBusy) {
            console.log(`Current user already busy: ${currentUserId}`);
            return null;
        }
        gender =
            gender?.toLowerCase();
        if (gender !== 'male' &&
            gender !== 'female') {
            console.log(`Invalid gender: ${gender}`);
            return null;
        }
        let targetGenders = [];
        if (preferenceGender?.toLowerCase() === 'female') {
            targetGenders = ['female'];
        }
        else if (preferenceGender?.toLowerCase() === 'male') {
            targetGenders = ['male'];
        }
        else if (preferenceGender?.toLowerCase() === 'both') {
            targetGenders = ['male', 'female'];
        }
        else {
            targetGenders = [gender === 'male' ? 'female' : 'male'];
        }
        const oppositeQueues = targetGenders.map(g => g === 'male' ? 'male_waiting' : 'female_waiting');
        let queueUsers = [];
        for (const queue of oppositeQueues) {
            const qUsers = await this.redisService.smembers(queue);
            queueUsers = queueUsers.concat(qUsers);
        }
        let users = [...queueUsers];
        if (!users.length) {
            console.log(`No users in queues: ${oppositeQueues.join(', ')}. Checking online users.`);
            for (const tGender of targetGenders) {
                const oUsers = await this.redisService.smembers(`online:${tGender}`);
                users = users.concat(oUsers);
            }
        }
        if (!users.length) {
            console.log(`No online/waiting users found for genders: ${targetGenders.join(', ')}`);
            await this.redisService.set(`queue:${currentUserId}`, 'true', 60);
            return null;
        }
        let currentUserCity = null;
        if (preferenceLocation?.toLowerCase() === 'nearby') {
            const currentUser = await this.usersService.findById(currentUserId);
            currentUserCity = currentUser?.city || null;
        }
        const shuffledUsers = [...users];
        for (let i = shuffledUsers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() *
                (i + 1));
            [
                shuffledUsers[i],
                shuffledUsers[j],
            ] = [
                shuffledUsers[j],
                shuffledUsers[i],
            ];
        }
        for (const userId of shuffledUsers) {
            if (userId === currentUserId) {
                continue;
            }
            const busy = await this.redisService.isBusy(userId);
            if (busy) {
                console.log(`Busy user skipped: ${userId}`);
                continue;
            }
            const matched = await this.redisService.getMatched(userId);
            if (matched) {
                console.log(`Matched user skipped: ${userId}`);
                continue;
            }
            const matching = await this.redisService.get(`matching:${userId}`);
            if (matching) {
                console.log(`Matching lock active: ${userId}`);
                continue;
            }
            const socketId = await this.redisService.get(`socket:${userId}`);
            if (!socketId) {
                console.log(`No socket for user: ${userId}`);
                for (const queue of oppositeQueues) {
                    await this.redisService.srem(queue, userId);
                }
                await this.redisService.del(`queue:${userId}`);
                continue;
            }
            if (preferenceLocation?.toLowerCase() === 'nearby' && currentUserCity) {
                const candidate = await this.usersService.findById(userId);
                if (!candidate || !candidate.city || candidate.city.toLowerCase().trim() !== currentUserCity.toLowerCase().trim()) {
                    console.log(`Candidate ${userId} skipped due to city mismatch or missing city`);
                    continue;
                }
            }
            const isFromQueue = queueUsers.includes(userId);
            if (isFromQueue) {
                const queueAlive = await this.redisService.get(`queue:${userId}`);
                if (!queueAlive) {
                    console.log(`Queue expired: ${userId}`);
                    for (const queue of oppositeQueues) {
                        await this.redisService.srem(queue, userId);
                    }
                    await this.redisService.del(`queue:${userId}`);
                    continue;
                }
            }
            await this.redisService.set(`queue:${userId}`, 'true', 60);
            await this.redisService.set(`matching:${userId}`, 'true', 15);
            await this.redisService.set(`matching:${currentUserId}`, 'true', 15);
            console.log(`🎯 Match Found: ${currentUserId} ↔ ${userId}`);
            return userId;
        }
        console.log(`No valid match found for: ${currentUserId}`);
        await this.redisService.set(`queue:${currentUserId}`, 'true', 60);
        return null;
    }
    async removeFromQueue(userId, gender) {
        gender =
            gender?.toLowerCase();
        if (gender !== 'male' &&
            gender !== 'female') {
            console.log(`Invalid gender: ${gender}`);
            return;
        }
        const queue = gender === 'male'
            ? 'male_waiting'
            : 'female_waiting';
        await this.redisService.srem(queue, userId);
        await this.redisService.del(`queue:${userId}`);
        console.log(`➖ Removed From Queue: ${userId}`);
    }
};
exports.MatchService = MatchService;
exports.MatchService = MatchService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_service_1.RedisService,
        users_service_1.UsersService])
], MatchService);
//# sourceMappingURL=matches.service.js.map