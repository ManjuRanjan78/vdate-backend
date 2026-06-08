import { Body, Controller, Post } from '@nestjs/common';

import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // =========================
  // SEND OTP
  // =========================

  @Post('send-otp')
  sendOtp(
    @Body()
    body: {
      phone: string;
    },
  ) {
    return this.authService.sendOtp(body.phone);
  }

  // =========================
  // VERIFY OTP
  // =========================

  @Post('verify-otp')
  async verifyOtp(
    @Body()
    body: {
      phone: string;
      otp: string;
    },
  ) {
    return this.authService.verifyOtp(body.phone, body.otp);
  }

  // =========================
  // GOOGLE LOGIN
  // =========================

  @Post('google')
  async googleLogin(
    @Body()
    body: {
      idToken: string;
    },
  ) {
    return this.authService.googleLogin(body.idToken);
  }

  // =========================
  // FACEBOOK LOGIN
  // =========================

  @Post('facebook')
  async facebookLogin(
    @Body()
    body: {
      accessToken: string;
    },
  ) {
    return this.authService.facebookLogin(body.accessToken);
  }

  // =========================
  // REFRESH TOKEN
  // =========================

  @Post('refresh')
  async refreshToken(
    @Body()
    body: {
      refreshToken: string;
    },
  ) {
    return this.authService.refreshToken(body.refreshToken);
  }

  // =========================
  // LOGOUT
  // =========================

  @Post('logout')
  async logout(
    @Body()
    body: {
      refreshToken: string;
    },
  ) {
    return this.authService.logout(body.refreshToken);
  }
}
