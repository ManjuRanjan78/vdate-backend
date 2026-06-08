import { PaymentsService } from './payments.service';
export declare class PaymentsController {
    private paymentsService;
    constructor(paymentsService: PaymentsService);
    createOrder(body: {
        packageId: string;
    }, req: any): Promise<{
        orderId: any;
        amount: number;
        currency: any;
        key: string | undefined;
    }>;
    verify(body: any): Promise<import("./entities/payment.entity").Payment>;
    history(req: any): Promise<import("./entities/payment.entity").Payment[]>;
}
