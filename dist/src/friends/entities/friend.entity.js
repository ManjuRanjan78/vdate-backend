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
exports.Friend = exports.FriendStatus = void 0;
const typeorm_1 = require("typeorm");
var FriendStatus;
(function (FriendStatus) {
    FriendStatus["PENDING"] = "pending";
    FriendStatus["ACCEPTED"] = "accepted";
    FriendStatus["REJECTED"] = "rejected";
})(FriendStatus || (exports.FriendStatus = FriendStatus = {}));
let Friend = class Friend {
    id;
    senderId;
    receiverId;
    status;
    createdAt;
    updatedAt;
};
exports.Friend = Friend;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Friend.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Friend.prototype, "senderId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Friend.prototype, "receiverId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: FriendStatus,
        default: FriendStatus.PENDING,
    }),
    __metadata("design:type", String)
], Friend.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Friend.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Friend.prototype, "updatedAt", void 0);
exports.Friend = Friend = __decorate([
    (0, typeorm_1.Entity)('friend_requests'),
    (0, typeorm_1.Index)(['senderId', 'receiverId', 'status'], { unique: true })
], Friend);
//# sourceMappingURL=friend.entity.js.map