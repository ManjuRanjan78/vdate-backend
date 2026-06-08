import { Injectable, UnauthorizedException } from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { OAuth2Client } from 'google-auth-library';

import axios from 'axios';

import { TwilioService } from './twilio.service';

import { UsersService } from '../users/users.service';

import { RefreshToken } from './dto/refresh-token.entity';
import { JwtPayload } from './auth.types';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(RefreshToken)
    private refreshTokenRepo: Repository<RefreshToken>,

    private twilioService: TwilioService,

    private usersService: UsersService,

    private jwtService: JwtService,
  ) {}

  // =========================
  // SEND OTP
  // =========================

  /* eslint-disable @typescript-eslint/no-unused-vars */
  async sendOtp(_phone: string) {
    /* eslint-enable @typescript-eslint/no-unused-vars */
    // Uncomment in production

    // await this.twilioService.sendOtp(
    //   _phone,
    // );

    return {
      otp: '123456', // Mock OTP for testing
      success: true,
      message: 'OTP sent successfully',
    };
  }

  // =========================
  // VERIFY OTP LOGIN
  // =========================

  /* eslint-disable @typescript-eslint/no-unused-vars */
  async verifyOtp(phone: string, _otp: string) {
    /* eslint-enable @typescript-eslint/no-unused-vars */
    if (!phone) {
      throw new UnauthorizedException('Phone number is required');
    }

    // Mock twilio verification

    const result = {
      valid: true,
    };

    // Production

    // const result =
    //   await this.twilioService.verifyOtp(
    //     phone,
    //     _otp,
    //   );

    if (!result.valid) {
      throw new UnauthorizedException('Invalid OTP');
    }

    // Check existing user

    let user = await this.usersService.findByPhone(phone);

    let isNewUser = false;

    // Create new user

    if (!user) {
      user = await this.usersService.createUser({
        phone,
      });

      isNewUser = true;
    }

    if (!user) {
      throw new UnauthorizedException('Failed to create user');
    }

    // Generate tokens

    const { accessToken, refreshToken } = this.generateTokens(user.id.toString());

    // Save refresh token

    await this.refreshTokenRepo.save({
      userId: user.id.toString(),
      token: refreshToken,
    });

    return {
      success: true,
      accessToken,
      refreshToken,
      isNewUser,
      user,
    };
  }

  // =========================
  // GOOGLE LOGIN
  // =========================

  async googleLogin(idToken: string) {
    // Validate google token

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      throw new UnauthorizedException('Invalid Google token');
    }

    const email = payload.email;

    if (!email) {
      throw new UnauthorizedException('Email not found');
    }

    // Check existing user

    let user = await this.usersService.findByEmail(email);

    let isNewUser = false;

    // Create user

    if (!user) {
      user = await this.usersService.createUser({
        email,
        googleId: payload.sub,
        name: payload.name,
        imageUrl: payload.picture,
      });

      isNewUser = true;
    } else if (!user.imageUrl && payload.picture) {
      await this.usersService.updateUser(user.id, {
        imageUrl: payload.picture,
      });
      user = await this.usersService.findById(user.id);
    }

    if (!user) {
      throw new UnauthorizedException('Failed to create user');
    }

    // Generate tokens

    const { accessToken, refreshToken } = this.generateTokens(user.id.toString());

    // Save refresh token

    await this.refreshTokenRepo.save({
      userId: user.id.toString(),
      token: refreshToken,
    });

    return {
      success: true,
      accessToken,
      refreshToken,
      isNewUser,
      user,
    };
  }

  // =========================
  // FACEBOOK LOGIN
  // =========================

  async facebookLogin(facebookAccessToken: string) {
    // Validate facebook token

    const response = await axios.get('https://graph.facebook.com/me', {
      params: {
        fields: 'id,name,email,picture',
        access_token: facebookAccessToken,
      },
    });

    const profile = response.data as {
      id: string;
      name: string;
      email: string;
    };

    if (!profile) {
      throw new UnauthorizedException('Invalid Facebook token');
    }

    // Check existing user

    let user = await this.usersService.findByEmail(profile.email);

    let isNewUser = false;

    // Create user

    if (!user) {
      user = await this.usersService.createUser({
        email: profile.email,
        facebookId: profile.id,
        name: profile.name,
      });

      isNewUser = true;
    }

    if (!user) {
      throw new UnauthorizedException('Failed to create user');
    }

    // Generate tokens

    const { accessToken, refreshToken } = this.generateTokens(user.id.toString());

    // Save refresh token

    await this.refreshTokenRepo.save({
      userId: user.id.toString(),
      token: refreshToken,
    });

    return {
      success: true,
      accessToken,
      refreshToken,
      isNewUser,
      user,
    };
  }

  // =========================
  // GENERATE TOKENS
  // =========================

generateTokens(userId: string) {

  const accessToken = this.jwtService.sign(
    {
      userId,
      type: 'access',
    },
    {
      secret: process.env.JWT_SECRET,
      expiresIn: '15m',
    },
  );

  const refreshToken = this.jwtService.sign(
    {
      userId,
      type: 'refresh',
    },
    {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '30d',
    },
  );

  return {
    accessToken,
    refreshToken,
  };
}

  // =========================
  // REFRESH TOKEN
  // =========================

  async refreshToken(refreshToken: string) {
    // Check token in DB

    const tokenRecord = await this.refreshTokenRepo.findOne({
      where: {
        token: refreshToken,
        isRevoked: false,
      },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Refresh token revoked');
    }

    try {
      // Verify JWT

      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      }) as JwtPayload;

      // Find user

      const user = await this.usersService.findById(payload.userId);

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Generate new access token

      const accessToken = this.jwtService.sign(
        {
          userId: user.id,
          type: 'access',
        },
        {
          secret: process.env.JWT_SECRET,
          expiresIn: '15m',
        },
      );

      return {
        accessToken,
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  // =========================
  // LOGOUT
  // =========================

  async logout(refreshToken: string) {
    const tokenRecord = await this.refreshTokenRepo.findOne({
      where: {
        token: refreshToken,
      },
    });

    if (tokenRecord) {
      tokenRecord.isRevoked = true;

      await this.refreshTokenRepo.save(tokenRecord);
    }

    return {
      success: true,
      message: 'Logged out successfully',
    };
  }
}
