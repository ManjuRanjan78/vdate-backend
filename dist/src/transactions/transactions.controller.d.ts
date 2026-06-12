import { TransactionsService } from './transactions.service';
export declare class TransactionsController {
    private readonly transactionsService;
    constructor(transactionsService: TransactionsService);
    getTransactions(userId: string): Promise<{
        success: boolean;
        userId: string;
        transactions: {
            id: number;
            type: string;
            amount: number;
            status: string;
            createdAt: Date;
        }[];
    }>;
}
