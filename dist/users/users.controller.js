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
var UsersController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("./users.service");
let UsersController = UsersController_1 = class UsersController {
    usersService;
    logger = new common_1.Logger(UsersController_1.name);
    constructor(usersService) {
        this.usersService = usersService;
    }
    async getCurrentUser(req) {
        const user = await this.usersService.findById(req.user.userId);
        return this.transformUserResponse(user);
    }
    async updateUser(body, req) {
        const userId = req.user?.userId;
        if (!userId) {
            throw new Error('User ID not found in authentication token');
        }
        const updates = {
            name: body.name ?? body.displayName,
            gender: body.gender,
            imageUrl: body.imageUrl,
            bio: body.bio,
            country: body.country,
            city: body.city,
            latitude: body.latitude,
            longitude: body.longitude,
            location: body.location,
            role: body.role,
            interests: body.interests,
            profileCompleted: body.profileCompleted,
        };
        if (body.isOnline !== undefined) {
            updates.isOnline = body.isOnline;
        }
        if (body.fcmToken !== undefined) {
            updates.fcmToken = body.fcmToken;
            this.logger.log(`Updating FCM token for user ${userId}`);
        }
        if (body.dateOfBirth) {
            updates.dob = body.dateOfBirth;
        }
        else if (body.dob) {
            updates.dob = body.dob;
        }
        if (body.isOnline === true) {
            updates.lastActiveAt = new Date();
        }
        delete updates.age;
        const updatedUser = await this.usersService.updateUser(userId, updates);
        return this.transformUserResponse(updatedUser);
    }
    async getFeed() {
        return await this.usersService.getOnlineUsers();
    }
    async getActiveLiveStreams() {
        const active = await this.usersService.getActiveLiveHosts();
        return active.map(u => this.transformUserResponse(u));
    }
    async getRandomMatch(userId) {
        if (!userId ||
            userId === 'null' ||
            userId === 'undefined') {
            return {
                statusCode: 400,
                message: 'User ID missing',
            };
        }
        const id = Number(userId);
        if (isNaN(id) ||
            id <= 0) {
            return {
                statusCode: 400,
                message: 'Invalid user ID',
            };
        }
        const match = await this.usersService
            .getRandomMatch(id);
        if (!match) {
            return {
                statusCode: 404,
                message: 'No online users available',
            };
        }
        return this.transformUserResponse(match);
    }
    async updateOnlineStatus(body, req) {
        const userId = body.userId || req.user?.userId;
        if (!userId) {
            return {
                statusCode: 400,
                message: 'User ID required',
            };
        }
        if (body.isOnline) {
            await this.usersService.setUserOnline(userId);
        }
        else {
            await this.usersService.setUserOffline(userId);
        }
        return {
            success: true,
            isOnline: body.isOnline,
        };
    }
    async getUser(id) {
        if (!id ||
            id === 'null' ||
            id === 'undefined') {
            console.log('User ID missing');
            return {
                statusCode: 400,
                message: 'User ID missing',
            };
        }
        const userId = Number(id);
        if (isNaN(userId) ||
            userId <= 0) {
            console.log('Invalid User ID:', id);
            return {
                statusCode: 400,
                message: 'Invalid user id',
            };
        }
        const user = await this.usersService.findById(userId);
        if (!user) {
            return {
                statusCode: 404,
                message: 'User not found',
            };
        }
        return this.transformUserResponse(user);
    }
    transformUserResponse(user) {
        if (!user) {
            return null;
        }
        const response = {
            ...user,
        };
        if (user.dob) {
            response.dateOfBirth =
                user.dob;
            const birthDate = new Date(user.dob);
            const today = new Date();
            let age = today.getFullYear() -
                birthDate.getFullYear();
            const monthDiff = today.getMonth() -
                birthDate.getMonth();
            if (monthDiff < 0 ||
                (monthDiff === 0 &&
                    today.getDate() <
                        birthDate.getDate())) {
                age--;
            }
            response.age = age;
        }
        delete response.dob;
        return response;
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getCurrentUser", null);
__decorate([
    (0, common_1.Post)('update'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateUser", null);
__decorate([
    (0, common_1.Get)('feed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getFeed", null);
__decorate([
    (0, common_1.Get)('live/active'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getActiveLiveStreams", null);
__decorate([
    (0, common_1.Get)('random-match/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getRandomMatch", null);
__decorate([
    (0, common_1.Post)('online-status'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateOnlineStatus", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getUser", null);
exports.UsersController = UsersController = UsersController_1 = __decorate([
    (0, common_1.Controller)('user'),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map