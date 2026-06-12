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
exports.BalanceController = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("../users/users.service");
let BalanceController = class BalanceController {
    usersService;
    constructor(usersService) {
        this.usersService = usersService;
    }
    async getBalance(userId) {
        const user = await this.usersService.findById(userId);
        return { balance: user?.coins || 0 };
    }
    async updateBalance(body) {
        const user = await this.usersService.findById(body.userId);
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const newBalance = (user.coins || 0) + body.amount;
        await this.usersService.updateUser(body.userId, { coins: newBalance });
        return { newBalance };
    }
    async transferCoins(body) {
        const fromUser = await this.usersService.findById(body.fromUserId);
        const toUser = await this.usersService.findById(body.toUserId);
        if (!fromUser || !toUser)
            throw new common_1.NotFoundException('User not found');
        if ((fromUser.coins || 0) < body.amount)
            throw new common_1.BadRequestException('Insufficient balance');
        const newFromBalance = (fromUser.coins || 0) - body.amount;
        const newToBalance = (toUser.coins || 0) + body.amount;
        await this.usersService.updateUser(body.fromUserId, { coins: newFromBalance });
        await this.usersService.updateUser(body.toUserId, { coins: newToBalance });
        return { success: true, newSenderBalance: newFromBalance };
    }
};
exports.BalanceController = BalanceController;
__decorate([
    (0, common_1.Get)(':userId'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BalanceController.prototype, "getBalance", null);
__decorate([
    (0, common_1.Post)('update'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BalanceController.prototype, "updateBalance", null);
__decorate([
    (0, common_1.Post)('transfer'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BalanceController.prototype, "transferCoins", null);
exports.BalanceController = BalanceController = __decorate([
    (0, common_1.Controller)('balance'),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], BalanceController);
//# sourceMappingURL=balance.controller.js.map