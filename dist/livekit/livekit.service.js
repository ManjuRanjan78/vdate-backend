"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LivekitService = void 0;
const common_1 = require("@nestjs/common");
const livekit_server_sdk_1 = require("livekit-server-sdk");
let LivekitService = class LivekitService {
    async createToken(userId, roomName, metadata) {
        const apiKey = process.env.LIVEKIT_API_KEY;
        const apiSecret = process.env.LIVEKIT_API_SECRET;
        if (!apiKey ||
            !apiSecret) {
            throw new common_1.InternalServerErrorException('LiveKit API key and secret are required');
        }
        const cleanUserId = userId?.trim();
        const cleanRoomName = roomName?.trim();
        if (!cleanUserId ||
            cleanUserId.length === 0) {
            throw new common_1.BadRequestException('LiveKit user identity is required');
        }
        if (!cleanRoomName ||
            cleanRoomName.length === 0) {
            throw new common_1.BadRequestException('LiveKit room name is required');
        }
        let safeMetadata;
        try {
            safeMetadata =
                metadata != null
                    ? JSON.stringify(metadata)
                    : undefined;
        }
        catch (e) {
            console.log('METADATA SERIALIZE ERROR:', e);
            safeMetadata =
                undefined;
        }
        const identity = `${cleanUserId}-${Date.now()}`;
        const token = new livekit_server_sdk_1.AccessToken(apiKey, apiSecret, {
            identity,
            ttl: '2h',
            metadata: safeMetadata,
        });
        token.addGrant({
            roomCreate: true,
            roomJoin: true,
            room: cleanRoomName,
            canPublish: true,
            canSubscribe: true,
            canPublishData: true,
            canUpdateOwnMetadata: true,
        });
        const jwt = await token.toJwt();
        console.log('TOKEN GENERATED SUCCESSFULLY');
        console.log(`IDENTITY: ${identity}`);
        console.log(`JWT LENGTH: ${jwt.length}`);
        return jwt;
    }
};
exports.LivekitService = LivekitService;
exports.LivekitService = LivekitService = __decorate([
    (0, common_1.Injectable)()
], LivekitService);
//# sourceMappingURL=livekit.service.js.map