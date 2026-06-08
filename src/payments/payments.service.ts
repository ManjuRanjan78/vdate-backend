import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { CoinTransaction } from './entities/coin-transaction.entity';
import { RazorpayService } from './razorpay.service';
import { UsersService } from '../users/users.service';
import * as crypto from 'crypto';
import { User } from '../users/users.entity';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Payment)
    private paymentsRepo: Repository<Payment>,
    @InjectRepository(CoinTransaction)
    private txRepo: Repository<CoinTransaction>,
    private razorpay: RazorpayService,
    private usersService: UsersService,
  ) {}

  private mapPackage(packageId: string) {
    // Map known packages
    const map: Record<string, { coins: number; amount: number }> = {
      '100_COINS': { coins: 100, amount: 99 },
      '500_COINS': { coins: 500, amount: 399 },
      '1000_COINS': { coins: 1000, amount: 699 },
      '1200_COINS': { coins: 1200, amount: 799 },
      '2500_COINS': { coins: 2500, amount: 1499 },
      '7000_COINS': { coins: 7000, amount: 2999 },
      '15000_COINS': { coins: 15000, amount: 5999 },
      '35000_COINS': { coins: 35000, amount: 12999 },
    };

    return map[packageId];
  }

  private normalizePackageId(packageId: string) {
    switch (packageId) {
      case 'coins_1200':
        return '1200_COINS';
      case 'coins_2500':
        return '2500_COINS';
      case 'coins_7000':
        return '7000_COINS';
      case 'coins_15000':
        return '15000_COINS';
      case 'coins_35000':
        return '35000_COINS';
      default:
        return packageId;
    }
  }

  async createOrder(userId: number, packageId: string) {
    const normalizedPackageId = this.normalizePackageId(packageId);
    const pkg = this.mapPackage(normalizedPackageId);
    if (!pkg) throw new BadRequestException('Invalid package');

    const amountPaise = pkg.amount * 100;
    // Prevent duplicate pending orders for same user/package within short window
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const recent = await this.paymentsRepo.findOne({
      where: { userId, packageId, status: 'created' },
      order: { createdAt: 'DESC' },
    });

    if (recent && recent.createdAt && recent.createdAt > fifteenMinutesAgo && recent.razorpayOrderId) {
      return { orderId: recent.razorpayOrderId, amount: recent.amount * 100, currency: 'INR', key: process.env.RAZORPAY_KEY_ID };
    }

    const ord = await this.razorpay.createOrder(amountPaise, 'INR', `user_${userId}_${Date.now()}`);

    const payment = this.paymentsRepo.create({
      userId,
      packageId,
      amount: pkg.amount,
      coins: pkg.coins,
      razorpayOrderId: ord.id,
      status: 'created',
    });

    await this.paymentsRepo.save(payment);

    return { orderId: ord.id, amount: amountPaise, currency: ord.currency, key: process.env.RAZORPAY_KEY_ID };
  }

  verifySignature(orderId: string, paymentId: string, signature: string) {
    const secret = process.env.RAZORPAY_KEY_SECRET || '';
    const hmac = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
    return hmac === signature;
  }

  async handlePaymentSuccess(payload: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string; }) {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = payload;

    return await this.paymentsRepo.manager.transaction(async (manager) => {
      const paymentRecord = await manager.findOne(Payment, { where: { razorpayOrderId: razorpay_order_id } });
      if (!paymentRecord) {
        throw new BadRequestException('Order not found');
      }

      // Idempotent: if already successful, return
      if (paymentRecord.status === 'success') {
        return paymentRecord;
      }

      // Prevent duplicate processing if another payment with same paymentId exists
      const existingByPaymentId = await manager.findOne(Payment, { where: { razorpayPaymentId: razorpay_payment_id } });
      if (existingByPaymentId && existingByPaymentId.status === 'success') {
        return existingByPaymentId;
      }

      const ok = this.verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
      if (!ok) {
        paymentRecord.status = 'failed';
        await manager.save(paymentRecord);
        throw new BadRequestException('Invalid signature');
      }

      paymentRecord.razorpayPaymentId = razorpay_payment_id;
      paymentRecord.status = 'success';
      await manager.save(paymentRecord);

      // Update user coins atomically
      await manager.increment(User, { id: paymentRecord.userId }, 'coins', paymentRecord.coins);

      // Create coin transaction if not exists
      const existingTx = await manager.findOne(CoinTransaction, { where: { paymentId: paymentRecord.id } });
      if (!existingTx) {
        const tx = manager.create(CoinTransaction, { userId: paymentRecord.userId, coins: paymentRecord.coins, type: 'purchase', paymentId: paymentRecord.id });
        await manager.save(tx);
      }

      return paymentRecord;
    });
  }

  async getHistory(userId: number) {
    const items = await this.paymentsRepo.find({ where: { userId }, order: { createdAt: 'DESC' } });
    return items;
  }
}
