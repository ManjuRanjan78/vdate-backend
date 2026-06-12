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
exports.LivekitController = void 0;
const common_1 = require("@nestjs/common");
const livekit_service_1 = require("./livekit.service");
let LivekitController = class LivekitController {
    livekitService;
    constructor(livekitService) {
        this.livekitService = livekitService;
    }
    async generateToken(roomName, identity, userId, name, image, gender) {
        try {
            if (!roomName ||
                roomName.trim().length === 0) {
                throw new common_1.BadRequestException('roomName query parameter is required');
            }
            const participantId = (identity ||
                userId)?.trim();
            if (!participantId) {
                throw new common_1.BadRequestException('identity or userId query parameter is required');
            }
            const metadata = {
                name: name ?? '',
                image: image ?? '',
                gender: gender ?? '',
            };
            console.log('=========================');
            console.log('LIVEKIT TOKEN REQUEST');
            console.log({
                roomName,
                participantId,
                metadata,
            });
            console.log('=========================');
            const token = await this.livekitService
                .createToken(participantId, roomName, metadata);
            if (!token) {
                throw new common_1.InternalServerErrorException('Failed to generate LiveKit token');
            }
            return {
                success: true,
                token,
                url: process.env
                    .LIVEKIT_URL ??
                    '',
                roomName,
                identity: participantId,
                metadata,
            };
        }
        catch (e) {
            console.log('LIVEKIT TOKEN ERROR:', e);
            throw e;
        }
    }
};
exports.LivekitController = LivekitController;
__decorate([
    (0, common_1.Get)('token'),
    __param(0, (0, common_1.Query)('roomName')),
    __param(1, (0, common_1.Query)('identity')),
    __param(2, (0, common_1.Query)('userId')),
    __param(3, (0, common_1.Query)('name')),
    __param(4, (0, common_1.Query)('image')),
    __param(5, (0, common_1.Query)('gender')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], LivekitController.prototype, "generateToken", null);
exports.LivekitController = LivekitController = __decorate([
    (0, common_1.Controller)('livekit'),
    __metadata("design:paramtypes", [livekit_service_1.LivekitService])
], LivekitController);
//# sourceMappingURL=livekit.controller.js.map