"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionsService = void 0;
const common_1 = require("@nestjs/common");
let TransactionsService = class TransactionsService {
    async getTransactions(userId) {
        return {
            success: true,
            userId,
            transactions: [
                {
                    id: 1,
                    type: 'coin_purchase',
                    amount: 100,
                    status: 'success',
                    createdAt: new Date(),
                },
                {
                    id: 2,
                    type: 'video_call',
                    amount: -20,
                    status: 'success',
                    createdAt: new Date(),
                },
                {
                    id: 3,
                    type: 'gift_sent',
                    amount: -50,
                    status: 'success',
                    createdAt: new Date(),
                },
            ],
        };
    }
};
exports.TransactionsService = TransactionsService;
exports.TransactionsService = TransactionsService = __decorate([
    (0, common_1.Injectable)()
], TransactionsService);
//# sourceMappingURL=transactions.service.js.map