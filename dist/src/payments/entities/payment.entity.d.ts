export declare class Payment {
    id: number;
    userId: number;
    packageId: string;
    amount: number;
    coins: number;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    status: string;
    createdAt: Date;
}
