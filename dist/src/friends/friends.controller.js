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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FriendsController = void 0;
const common_1 = require("@nestjs/common");
const friends_service_1 = require("./friends.service");
let FriendsController = class FriendsController {
    friendsService;
    constructor(friendsService) {
        this.friendsService = friendsService;
    }
    async sendFriendRequest(req, body) {
        const senderId = req.user?.userId || Number(body.senderId);
        return this.friendsService.sendFriendRequest(Number(senderId), Number(body.receiverId));
    }
    async acceptFriendRequest(body) {
        return this.friendsService.acceptFriendRequest(body.requestId);
    }
    async rejectFriendRequest(body) {
        return this.friendsService.rejectFriendRequest(body.requestId);
    }
    async acceptFriendRequestByUsers(body) {
        return this.friendsService.acceptFriendRequestByUsers(Number(body.acceptorId), Number(body.requesterId));
    }
    async rejectFriendRequestByUsers(body) {
        return this.friendsService.rejectFriendRequestByUsers(Number(body.rejectorId), Number(body.requesterId));
    }
    async getMutualFriends(req) {
        const userId = req.user?.userId;
        if (!userId) {
            throw new common_1.UnauthorizedException();
        }
        return this.friendsService.getMutualFriends(Number(userId));
    }
    async getFriends(userId) {
        return this.friendsService.getFriends(Number(userId));
    }
    async getPendingRequests(userId) {
        return this.friendsService.getPendingRequests(Number(userId));
    }
    async getFriendStatus(userId, otherUserId) {
        return this.friendsService.getFriendStatus(Number(userId), Number(otherUserId));
    }
};
exports.FriendsController = FriendsController;
__decorate([
    (0, common_1.Post)('request'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], FriendsController.prototype, "sendFriendRequest", null);
__decorate([
    (0, common_1.Post)('accept'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FriendsController.prototype, "acceptFriendRequest", null);
__decorate([
    (0, common_1.Post)('reject'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FriendsController.prototype, "rejectFriendRequest", null);
__decorate([
    (0, common_1.Post)('accept-by-users'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FriendsController.prototype, "acceptFriendRequestByUsers", null);
__decorate([
    (0, common_1.Post)('reject-by-users'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FriendsController.prototype, "rejectFriendRequestByUsers", null);
__decorate([
    (0, common_1.Get)('mutual'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FriendsController.prototype, "getMutualFriends", null);
__decorate([
    (0, common_1.Get)('list/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FriendsController.prototype, "getFriends", null);
__decorate([
    (0, common_1.Get)('pending/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FriendsController.prototype, "getPendingRequests", null);
__decorate([
    (0, common_1.Get)('status/:userId/:otherUserId'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Param)('otherUserId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], FriendsController.prototype, "getFriendStatus", null);
exports.FriendsController = FriendsController = __decorate([
    (0, common_1.Controller)('friends'),
    __metadata("design:paramtypes", [friends_service_1.FriendsService])
], FriendsController);
//# sourceMappingURL=friends.controller.js.map