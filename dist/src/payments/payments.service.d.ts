import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { CoinTransaction } from './entities/coin-transaction.entity';
import { RazorpayService } from './razorpay.service';
import { UsersService } from '../users/users.service';
export declare class PaymentsService {
    private paymentsRepo;
    private txRepo;
    private razorpay;
    private usersService;
    private readonly logger;
    constructor(paymentsRepo: Repository<Payment>, txRepo: Repository<CoinTransaction>, razorpay: RazorpayService, usersService: UsersService);
    private mapPackage;
    private normalizePackageId;
    createOrder(userId: number, packageId: string): Promise<{
        orderId: any;
        amount: number;
        currency: any;
        key: string | undefined;
    }>;
    verifySignature(orderId: string, paymentId: string, signature: string): boolean;
    handlePaymentSuccess(payload: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
    }): Promise<Payment>;
    getHistory(userId: number): Promise<Payment[]>;
}
