import { Repository } from 'typeorm';
import { User } from './users.entity';
import { RedisService } from '../redis/redis.service';
export declare class UsersService {
    private userRepo;
    private redisService;
    constructor(userRepo: Repository<User>, redisService: RedisService);
    findByPhone(phone: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    findById(id: number | string): Promise<User | null>;
    createUser(data: Partial<User>): Promise<User>;
    updateUser(id: number | string, updates: Partial<User>): Promise<User | null>;
    updateCoins(userId: number | string, amount: number): Promise<number>;
    setUserOnline(userId: number | string): Promise<void>;
    setUserOffline(userId: number | string): Promise<void>;
    getOnlineUsers(): Promise<User[]>;
    getActiveLiveHosts(): Promise<User[]>;
    getRandomMatch(currentUserId: number): Promise<User | null>;
    getPublicProfile(userId: number): Promise<User | null>;
    setUserOnlineForCalls(userId: number | string): Promise<void>;
    setUserOfflineForCalls(userId: number | string): Promise<void>;
}
