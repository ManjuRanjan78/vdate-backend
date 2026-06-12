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
exports.CallHistoryGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const call_history_service_1 = require("./call-history.service");
let CallHistoryGateway = class CallHistoryGateway {
    callHistoryService;
    constructor(callHistoryService) {
        this.callHistoryService = callHistoryService;
    }
    async handleCallStarted(client, data) {
        try {
            const record = await this.callHistoryService.createCallRecord({
                callerId: data.callerId,
                receiverId: data.receiverId,
                roomName: data.roomName,
                callType: data.callType || 'VIDEO',
                status: 'STARTED',
                startedAt: new Date(),
            });
            client.emit('call_history_created', { id: record.id });
            return record;
        }
        catch (error) {
            console.error('Call started error:', error);
        }
    }
    async handleCallEnded(client, data) {
        try {
            await this.callHistoryService.endCallRecord(data.id, data.duration, 'COMPLETED');
        }
        catch (error) {
            console.error('Call ended error:', error);
        }
    }
    async handleCallRejected(client, data) {
        try {
            await this.callHistoryService.endCallRecord(data.id, 0, 'REJECTED');
        }
        catch (error) {
            console.error('Call rejected error:', error);
        }
    }
    async handleCallMissed(client, data) {
        try {
            await this.callHistoryService.endCallRecord(data.id, 0, 'MISSED');
        }
        catch (error) {
            console.error('Call missed error:', error);
        }
    }
};
exports.CallHistoryGateway = CallHistoryGateway;
__decorate([
    (0, websockets_1.SubscribeMessage)('call_started'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], CallHistoryGateway.prototype, "handleCallStarted", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('call_ended'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], CallHistoryGateway.prototype, "handleCallEnded", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('call_rejected'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], CallHistoryGateway.prototype, "handleCallRejected", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('call_missed'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], CallHistoryGateway.prototype, "handleCallMissed", null);
exports.CallHistoryGateway = CallHistoryGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: { origin: '*' },
    }),
    __metadata("design:paramtypes", [call_history_service_1.CallHistoryService])
], CallHistoryGateway);
//# sourceMappingURL=call-history.gateway.js.map