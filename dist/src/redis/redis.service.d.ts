import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
export declare class RedisService implements OnModuleInit, OnModuleDestroy {
    private client;
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    set(key: string, value: any, ttlSeconds?: number): Promise<void>;
    get(key: string): Promise<any>;
    del(key: string): Promise<void>;
    exists(key: string): Promise<number>;
    sadd(key: string, value: string): Promise<void>;
    srem(key: string, value: string): Promise<void>;
    smembers(key: string): Promise<string[]>;
    addOnlineUser(userId: string, gender?: string): Promise<void>;
    getOnlineUsers(): Promise<string[]>;
    removeOnlineUser(userId: string): Promise<void>;
    setBusy(userId: string): Promise<void>;
    removeBusy(userId: string): Promise<void>;
    isBusy(userId: string): Promise<any>;
    setMatched(userId: string, peerId: string): Promise<void>;
    getMatched(userId: string): Promise<any>;
    clearMatched(userId: string): Promise<void>;
    getNextAvailableUser(currentUserId: string): Promise<string | null>;
    clearMatchPair(userId1: string, userId2: string): Promise<void>;
    addMatchHistory(userId1: string, userId2: string): Promise<void>;
    hasMatchHistory(userId1: string, userId2: string): Promise<boolean>;
}
