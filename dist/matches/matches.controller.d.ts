import { RedisService } from '../redis/redis.service';
export declare class MatchesController {
    private readonly redisService;
    constructor(redisService: RedisService);
    getQueues(): Promise<{
        maleQueue: string[];
        femaleQueue: string[];
    }>;
}
