import { UsersService } from '../users/users.service';
export declare class BalanceController {
    private usersService;
    constructor(usersService: UsersService);
    getBalance(userId: string): Promise<{
        balance: number;
    }>;
    updateBalance(body: {
        userId: string;
        amount: number;
    }): Promise<{
        newBalance: number;
    }>;
    transferCoins(body: {
        fromUserId: string;
        toUserId: string;
        amount: number;
        description?: string;
    }): Promise<{
        success: boolean;
        newSenderBalance: number;
    }>;
}
