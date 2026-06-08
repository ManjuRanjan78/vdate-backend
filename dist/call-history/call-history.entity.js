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
exports.CallHistory = void 0;
const typeorm_1 = require("typeorm");
let CallHistory = class CallHistory {
    id;
    callId;
    callerId;
    receiverId;
    roomName;
    callType;
    duration;
    status;
    startedAt;
    endedAt;
    createdAt;
};
exports.CallHistory = CallHistory;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], CallHistory.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], CallHistory.prototype, "callId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], CallHistory.prototype, "callerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], CallHistory.prototype, "receiverId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], CallHistory.prototype, "roomName", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'VIDEO' }),
    __metadata("design:type", String)
], CallHistory.prototype, "callType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], CallHistory.prototype, "duration", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'STARTED' }),
    __metadata("design:type", String)
], CallHistory.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp with time zone', nullable: true }),
    __metadata("design:type", Date)
], CallHistory.prototype, "startedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp with time zone', nullable: true }),
    __metadata("design:type", Date)
], CallHistory.prototype, "endedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp with time zone' }),
    __metadata("design:type", Date)
], CallHistory.prototype, "createdAt", void 0);
exports.CallHistory = CallHistory = __decorate([
    (0, typeorm_1.Entity)('call_history')
], CallHistory);
//# sourceMappingURL=call-history.entity.js.map