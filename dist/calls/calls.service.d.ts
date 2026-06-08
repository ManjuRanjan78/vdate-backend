import { Repository } from 'typeorm';
import { RedisService } from '../redis/redis.service';
import { User } from '../users/users.entity';
import { CallHistoryService } from '../call-history/call-history.service';
export declare class CallsService {
    private readonly redisService;
    private readonly usersRepository;
    private readonly callHistoryService;
    constructor(redisService: RedisService, usersRepository: Repository<User>, callHistoryService: CallHistoryService);
    startVideoCall(currentUserId: string, receiverId: string): Promise<{
        callId: any;
        status: string;
        message: string;
    }>;
    endVideoCall(callId: string): Promise<{
        status: string;
    }>;
}
