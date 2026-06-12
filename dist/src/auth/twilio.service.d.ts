import { ConfigService } from '@nestjs/config';
export declare class TwilioService {
    private configService;
    private client;
    constructor(configService: ConfigService);
    sendOtp(phone: string): Promise<import("twilio/lib/rest/verify/v2/service/verification").VerificationInstance>;
    verifyOtp(phone: string, code: string): Promise<import("twilio/lib/rest/verify/v2/service/verificationCheck").VerificationCheckInstance>;
}
