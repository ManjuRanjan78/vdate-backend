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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CallHistorySchema = exports.CallHistory = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let CallHistory = class CallHistory {
    callerId;
    receiverId;
    roomName;
    callerName;
    receiverName;
    callType;
    duration;
    status;
    startedAt;
    endedAt;
    createdAt;
    updatedAt;
};
exports.CallHistory = CallHistory;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], CallHistory.prototype, "callerId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], CallHistory.prototype, "receiverId", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], CallHistory.prototype, "roomName", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], CallHistory.prototype, "callerName", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], CallHistory.prototype, "receiverName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 'VIDEO' }),
    __metadata("design:type", String)
], CallHistory.prototype, "callType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], CallHistory.prototype, "duration", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 'STARTED' }),
    __metadata("design:type", String)
], CallHistory.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], CallHistory.prototype, "startedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], CallHistory.prototype, "endedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], CallHistory.prototype, "createdAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], CallHistory.prototype, "updatedAt", void 0);
exports.CallHistory = CallHistory = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], CallHistory);
exports.CallHistorySchema = mongoose_1.SchemaFactory.createForClass(CallHistory);
//# sourceMappingURL=call-history.schema.js.map