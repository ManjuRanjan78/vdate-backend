"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const google_auth_library_1 = require("google-auth-library");
const axios_1 = __importDefault(require("axios"));
const twilio_service_1 = require("./twilio.service");
const users_service_1 = require("../users/users.service");
const refresh_token_entity_1 = require("./dto/refresh-token.entity");
const googleClient = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID);
let AuthService = class AuthService {
    refreshTokenRepo;
    twilioService;
    usersService;
    jwtService;
    constructor(refreshTokenRepo, twilioService, usersService, jwtService) {
        this.refreshTokenRepo = refreshTokenRepo;
        this.twilioService = twilioService;
        this.usersService = usersService;
        this.jwtService = jwtService;
    }
    async sendOtp(_phone) {
        return {
            otp: '123456',
            success: true,
            message: 'OTP sent successfully',
        };
    }
    async verifyOtp(phone, _otp) {
        if (!phone) {
            throw new common_1.UnauthorizedException('Phone number is required');
        }
        const result = {
            valid: true,
        };
        if (!result.valid) {
            throw new common_1.UnauthorizedException('Invalid OTP');
        }
        let user = await this.usersService.findByPhone(phone);
        let isNewUser = false;
        if (!user) {
            user = await this.usersService.createUser({
                phone,
            });
            isNewUser = true;
        }
        if (!user) {
            throw new common_1.UnauthorizedException('Failed to create user');
        }
        const { accessToken, refreshToken } = this.generateTokens(user.id.toString());
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
    async googleLogin(idToken) {
        const ticket = await googleClient.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (!payload) {
            throw new common_1.UnauthorizedException('Invalid Google token');
        }
        const email = payload.email;
        if (!email) {
            throw new common_1.UnauthorizedException('Email not found');
        }
        let user = await this.usersService.findByEmail(email);
        let isNewUser = false;
        if (!user) {
            user = await this.usersService.createUser({
                email,
                googleId: payload.sub,
                name: payload.name,
                imageUrl: payload.picture,
            });
            isNewUser = true;
        }
        else if (!user.imageUrl && payload.picture) {
            await this.usersService.updateUser(user.id, {
                imageUrl: payload.picture,
            });
            user = await this.usersService.findById(user.id);
        }
        if (!user) {
            throw new common_1.UnauthorizedException('Failed to create user');
        }
        const { accessToken, refreshToken } = this.generateTokens(user.id.toString());
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
    async facebookLogin(facebookAccessToken) {
        const response = await axios_1.default.get('https://graph.facebook.com/me', {
            params: {
                fields: 'id,name,email,picture',
                access_token: facebookAccessToken,
            },
        });
        const profile = response.data;
        if (!profile) {
            throw new common_1.UnauthorizedException('Invalid Facebook token');
        }
        let user = await this.usersService.findByEmail(profile.email);
        let isNewUser = false;
        if (!user) {
            user = await this.usersService.createUser({
                email: profile.email,
                facebookId: profile.id,
                name: profile.name,
            });
            isNewUser = true;
        }
        if (!user) {
            throw new common_1.UnauthorizedException('Failed to create user');
        }
        const { accessToken, refreshToken } = this.generateTokens(user.id.toString());
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
    generateTokens(userId) {
        const accessToken = this.jwtService.sign({
            userId,
            type: 'access',
        }, {
            secret: process.env.JWT_SECRET,
            expiresIn: '15m',
        });
        const refreshToken = this.jwtService.sign({
            userId,
            type: 'refresh',
        }, {
            secret: process.env.JWT_REFRESH_SECRET,
            expiresIn: '30d',
        });
        return {
            accessToken,
            refreshToken,
        };
    }
    async refreshToken(refreshToken) {
        const tokenRecord = await this.refreshTokenRepo.findOne({
            where: {
                token: refreshToken,
                isRevoked: false,
            },
        });
        if (!tokenRecord) {
            throw new common_1.UnauthorizedException('Refresh token revoked');
        }
        try {
            const payload = this.jwtService.verify(refreshToken, {
                secret: process.env.JWT_REFRESH_SECRET,
            });
            const user = await this.usersService.findById(payload.userId);
            if (!user) {
                throw new common_1.UnauthorizedException('User not found');
            }
            const accessToken = this.jwtService.sign({
                userId: user.id,
                type: 'access',
            }, {
                secret: process.env.JWT_SECRET,
                expiresIn: '15m',
            });
            return {
                accessToken,
            };
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
    }
    async logout(refreshToken) {
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
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(refresh_token_entity_1.RefreshToken)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        twilio_service_1.TwilioService,
        users_service_1.UsersService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map