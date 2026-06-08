import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';

@Injectable()
export class TwilioService {
  private client: Twilio;

  constructor(private configService: ConfigService) {
    this.client = new Twilio(
      this.configService.get<string>('TWILIO_ACCOUNT_SID'),
      this.configService.get<string>('TWILIO_AUTH_TOKEN'),
    );
  }

  async sendOtp(phone: string) {
    return this.client.verify.v2
      .services(this.configService.get<string>('TWILIO_VERIFY_SERVICE_SID')!)
      .verifications.create({
        to: phone,
        channel: 'sms',
      });
  }

  async verifyOtp(phone: string, code: string) {
    return this.client.verify.v2
      .services(this.configService.get<string>('TWILIO_VERIFY_SERVICE_SID')!)
      .verificationChecks.create({
        to: phone,
        code,
      });
  }
}
