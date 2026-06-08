import { ConfigService } from '@nestjs/config';
export declare class RazorpayService {
    private config;
    private readonly logger;
    private client;
    constructor(config: ConfigService);
    createOrder(amountInPaise: number, currency?: string, receipt?: string): Promise<any>;
}
