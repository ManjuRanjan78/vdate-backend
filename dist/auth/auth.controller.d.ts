import { AuthService } from './auth.service';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    sendOtp(body: {
        phone: string;
    }): Promise<{
        otp: string;
        success: boolean;
        message: string;
    }>;
    verifyOtp(body: {
        phone: string;
        otp: string;
    }): Promise<{
        success: boolean;
        accessToken: string;
        refreshToken: string;
        isNewUser: boolean;
        user: import("../users/users.entity").User;
    }>;
    googleLogin(body: {
        idToken: string;
    }): Promise<{
        success: boolean;
        accessToken: string;
        refreshToken: string;
        isNewUser: boolean;
        user: import("../users/users.entity").User;
    }>;
    facebookLogin(body: {
        accessToken: string;
    }): Promise<{
        success: boolean;
        accessToken: string;
        refreshToken: string;
        isNewUser: boolean;
        user: import("../users/users.entity").User;
    }>;
    refreshToken(body: {
        refreshToken: string;
    }): Promise<{
        accessToken: string;
    }>;
    logout(body: {
        refreshToken: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
}
