import { Injectable, Logger } from '@nestjs/common';
import Razorpay from 'razorpay';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RazorpayService {
  private readonly logger = new Logger(RazorpayService.name);
  private client: any;

  constructor(private config: ConfigService) {
    const keyId = this.config.get<string>('RAZORPAY_KEY_ID');
    const keySecret = this.config.get<string>('RAZORPAY_KEY_SECRET');

    this.client = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }

  async createOrder(amountInPaise: number, currency = 'INR', receipt = '') {
    try {
      const ord = await this.client.orders.create({
        amount: amountInPaise,
        currency,
        receipt,
        payment_capture: 1,
      });

      this.logger.debug(`Razorpay order created: ${JSON.stringify(ord)}`);

      return ord;
    } catch (e) {
      this.logger.error('Razorpay create order error', e);
      throw e;
    }
  }
}
