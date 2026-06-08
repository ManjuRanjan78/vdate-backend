import { RedisService } from '../redis/redis.service';
import { UsersService } from '../users/users.service';
export declare class MatchService {
    private readonly redisService;
    private readonly usersService;
    constructor(redisService: RedisService, usersService: UsersService);
    addToQueue(userId: string, gender: string): Promise<void>;
    getMatch(currentUserId: string, gender: string, preferenceGender?: string, preferenceLocation?: string): Promise<string | null>;
    removeFromQueue(userId: string, gender: string): Promise<void>;
}
