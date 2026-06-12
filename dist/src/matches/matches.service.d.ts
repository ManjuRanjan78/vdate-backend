import { RedisService } from '../redis/redis.service';
import { UsersService } from '../users/users.service';
export declare class MatchService {
    private readonly redisService;
    private readonly usersService;
    constructor(redisService: RedisService, usersService: UsersService);
    private normalizePreferenceGender;
    private getAcceptedGenders;
    isMatchPreferenceCompatible(currentUserGender: string, currentUserPreference?: string | null, candidateGender?: string, candidatePreference?: string | null): boolean;
    private getQueuePreferenceKey;
    private setQueuePreferences;
    private clearQueuePreferences;
    getQueuePreferenceGender(userId: string): Promise<string | null>;
    getQueuePreferenceLocation(userId: string): Promise<string | null>;
    addToQueue(userId: string, gender: string, preferenceGender?: string | null, preferenceLocation?: string | null): Promise<void>;
    getMatch(currentUserId: string, gender: string, preferenceGender?: string | null, preferenceLocation?: string | null): Promise<string | null>;
    removeFromQueue(userId: string, gender: string): Promise<void>;
}
