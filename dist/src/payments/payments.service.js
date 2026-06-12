"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var PaymentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const payment_entity_1 = require("./entities/payment.entity");
const coin_transaction_entity_1 = require("./entities/coin-transaction.entity");
const razorpay_service_1 = require("./razorpay.service");
const users_service_1 = require("../users/users.service");
const crypto = __importStar(require("crypto"));
const users_entity_1 = require("../users/users.entity");
let PaymentsService = PaymentsService_1 = class PaymentsService {
    paymentsRepo;
    txRepo;
    razorpay;
    usersService;
    logger = new common_1.Logger(PaymentsService_1.name);
    constructor(paymentsRepo, txRepo, razorpay, usersService) {
        this.paymentsRepo = paymentsRepo;
        this.txRepo = txRepo;
        this.razorpay = razorpay;
        this.usersService = usersService;
    }
    mapPackage(packageId) {
        const map = {
            '100_COINS': { coins: 100, amount: 99 },
            '500_COINS': { coins: 500, amount: 399 },
            '1000_COINS': { coins: 1000, amount: 699 },
            '1200_COINS': { coins: 1200, amount: 799 },
            '2500_COINS': { coins: 2500, amount: 1499 },
            '7000_COINS': { coins: 7000, amount: 2999 },
            '15000_COINS': { coins: 15000, amount: 5999 },
            '35000_COINS': { coins: 35000, amount: 12999 },
        };
        return map[packageId];
    }
    normalizePackageId(packageId) {
        switch (packageId) {
            case 'coins_1200':
                return '1200_COINS';
            case 'coins_2500':
                return '2500_COINS';
            case 'coins_7000':
                return '7000_COINS';
            case 'coins_15000':
                return '15000_COINS';
            case 'coins_35000':
                return '35000_COINS';
            default:
                return packageId;
        }
    }
    async createOrder(userId, packageId) {
        const normalizedPackageId = this.normalizePackageId(packageId);
        const pkg = this.mapPackage(normalizedPackageId);
        if (!pkg)
            throw new common_1.BadRequestException('Invalid package');
        const amountPaise = pkg.amount * 100;
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        const recent = await this.paymentsRepo.findOne({
            where: { userId, packageId, status: 'created' },
            order: { createdAt: 'DESC' },
        });
        if (recent && recent.createdAt && recent.createdAt > fifteenMinutesAgo && recent.razorpayOrderId) {
            return { orderId: recent.razorpayOrderId, amount: recent.amount * 100, currency: 'INR', key: process.env.RAZORPAY_KEY_ID };
        }
        const ord = await this.razorpay.createOrder(amountPaise, 'INR', `user_${userId}_${Date.now()}`);
        const payment = this.paymentsRepo.create({
            userId,
            packageId,
            amount: pkg.amount,
            coins: pkg.coins,
            razorpayOrderId: ord.id,
            status: 'created',
        });
        await this.paymentsRepo.save(payment);
        return { orderId: ord.id, amount: amountPaise, currency: ord.currency, key: process.env.RAZORPAY_KEY_ID };
    }
    verifySignature(orderId, paymentId, signature) {
        const secret = process.env.RAZORPAY_KEY_SECRET || '';
        const hmac = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
        return hmac === signature;
    }
    async handlePaymentSuccess(payload) {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = payload;
        return await this.paymentsRepo.manager.transaction(async (manager) => {
            const paymentRecord = await manager.findOne(payment_entity_1.Payment, { where: { razorpayOrderId: razorpay_order_id } });
            if (!paymentRecord) {
                throw new common_1.BadRequestException('Order not found');
            }
            if (paymentRecord.status === 'success') {
                return paymentRecord;
            }
            const existingByPaymentId = await manager.findOne(payment_entity_1.Payment, { where: { razorpayPaymentId: razorpay_payment_id } });
            if (existingByPaymentId && existingByPaymentId.status === 'success') {
                return existingByPaymentId;
            }
            const ok = this.verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
            if (!ok) {
                paymentRecord.status = 'failed';
                await manager.save(paymentRecord);
                throw new common_1.BadRequestException('Invalid signature');
            }
            paymentRecord.razorpayPaymentId = razorpay_payment_id;
            paymentRecord.status = 'success';
            await manager.save(paymentRecord);
            await manager.increment(users_entity_1.User, { id: paymentRecord.userId }, 'coins', paymentRecord.coins);
            const existingTx = await manager.findOne(coin_transaction_entity_1.CoinTransaction, { where: { paymentId: paymentRecord.id } });
            if (!existingTx) {
                const tx = manager.create(coin_transaction_entity_1.CoinTransaction, { userId: paymentRecord.userId, coins: paymentRecord.coins, type: 'purchase', paymentId: paymentRecord.id });
                await manager.save(tx);
            }
            return paymentRecord;
        });
    }
    async getHistory(userId) {
        const items = await this.paymentsRepo.find({ where: { userId }, order: { createdAt: 'DESC' } });
        return items;
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = PaymentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(payment_entity_1.Payment)),
    __param(1, (0, typeorm_1.InjectRepository)(coin_transaction_entity_1.CoinTransaction)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        razorpay_service_1.RazorpayService,
        users_service_1.UsersService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map