import { Controller, Post, Body, Get, Req, BadRequestException } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('create-order')
  async createOrder(@Body() body: { packageId: string }, @Req() req: any) {
    const userId = req.user?.userId || body['userId'] || null;
    if (!userId) throw new BadRequestException('Missing userId');
    return this.paymentsService.createOrder(Number(userId), body.packageId);
  }

  @Post('verify')
  async verify(@Body() body: any) {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw new BadRequestException('Missing fields');
    }

    return this.paymentsService.handlePaymentSuccess({ razorpay_order_id, razorpay_payment_id, razorpay_signature });
  }

  @Get('history')
  async history(@Req() req: any) {
    const userId = req.user?.userId || null;
    if (!userId) throw new BadRequestException('Missing userId');
    return this.paymentsService.getHistory(Number(userId));
  }
}
