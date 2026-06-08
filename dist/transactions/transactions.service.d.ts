export declare class TransactionsService {
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
