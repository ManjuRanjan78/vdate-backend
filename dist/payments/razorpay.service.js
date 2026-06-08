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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var RazorpayService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RazorpayService = void 0;
const common_1 = require("@nestjs/common");
const razorpay_1 = __importDefault(require("razorpay"));
const config_1 = require("@nestjs/config");
let RazorpayService = RazorpayService_1 = class RazorpayService {
    config;
    logger = new common_1.Logger(RazorpayService_1.name);
    client;
    constructor(config) {
        this.config = config;
        const keyId = this.config.get('RAZORPAY_KEY_ID');
        const keySecret = this.config.get('RAZORPAY_KEY_SECRET');
        this.client = new razorpay_1.default({
            key_id: keyId,
            key_secret: keySecret,
        });
    }
    async createOrder(amountInPaise, currency = 'INR', receipt = '') {
        try {
            const ord = await this.client.orders.create({
                amount: amountInPaise,
                currency,
                receipt,
                payment_capture: 1,
            });
            this.logger.debug(`Razorpay order created: ${JSON.stringify(ord)}`);
            return ord;
        }
        catch (e) {
            this.logger.error('Razorpay create order error', e);
            throw e;
        }
    }
};
exports.RazorpayService = RazorpayService;
exports.RazorpayService = RazorpayService = RazorpayService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RazorpayService);
//# sourceMappingURL=razorpay.service.js.map