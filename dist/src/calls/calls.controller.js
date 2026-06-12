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
exports.CallsController = void 0;
const common_1 = require("@nestjs/common");
const calls_service_1 = require("./calls.service");
const start_video_call_dto_1 = require("./dto/start-video-call.dto");
const end_video_call_dto_1 = require("./dto/end-video-call.dto");
let CallsController = class CallsController {
    callsService;
    constructor(callsService) {
        this.callsService = callsService;
    }
    async startVideoCall(body, req) {
        const currentUserId = body.currentUserId || req.user?.userId;
        if (!currentUserId) {
            throw new Error('Current user ID is required');
        }
        return this.callsService.startVideoCall(currentUserId, body.receiverId);
    }
    async endVideoCall(body) {
        return this.callsService
            .endVideoCall(body.callId);
    }
};
exports.CallsController = CallsController;
__decorate([
    (0, common_1.Post)('video/start'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [start_video_call_dto_1.StartVideoCallDto, Object]),
    __metadata("design:returntype", Promise)
], CallsController.prototype, "startVideoCall", null);
__decorate([
    (0, common_1.Post)('video/end'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [end_video_call_dto_1.EndVideoCallDto]),
    __metadata("design:returntype", Promise)
], CallsController.prototype, "endVideoCall", null);
exports.CallsController = CallsController = __decorate([
    (0, common_1.Controller)('calls'),
    __metadata("design:paramtypes", [calls_service_1.CallsService])
], CallsController);
//# sourceMappingURL=calls.controller.js.map