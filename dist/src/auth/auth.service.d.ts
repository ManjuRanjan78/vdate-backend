import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { TwilioService } from './twilio.service';
import { UsersService } from '../users/users.service';
import { RefreshToken } from './dto/refresh-token.entity';
export declare class AuthService {
    private refreshTokenRepo;
    private twilioService;
    private usersService;
    private jwtService;
    constructor(refreshTokenRepo: Repository<RefreshToken>, twilioService: TwilioService, usersService: UsersService, jwtService: JwtService);
    sendOtp(_phone: string): Promise<{
        otp: string;
        success: boolean;
        message: string;
    }>;
    verifyOtp(phone: string, _otp: string): Promise<{
        success: boolean;
        accessToken: string;
        refreshToken: string;
        isNewUser: boolean;
        user: import("../users/users.entity").User;
    }>;
    googleLogin(idToken: string): Promise<{
        success: boolean;
        accessToken: string;
        refreshToken: string;
        isNewUser: boolean;
        user: import("../users/users.entity").User;
    }>;
    facebookLogin(facebookAccessToken: string): Promise<{
        success: boolean;
        accessToken: string;
        refreshToken: string;
        isNewUser: boolean;
        user: import("../users/users.entity").User;
    }>;
    generateTokens(userId: string): {
        accessToken: string;
        refreshToken: string;
    };
    refreshToken(refreshToken: string): Promise<{
        accessToken: string;
    }>;
    logout(refreshToken: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
