"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketModule = void 0;
const common_1 = require("@nestjs/common");
const socket_gateway_1 = require("./socket.gateway");
const users_module_1 = require("../users/users.module");
const chat_module_1 = require("../chat/chat.module");
const redis_module_1 = require("../redis/redis.module");
const matches_module_1 = require("../matches/matches.module");
const friends_module_1 = require("../friends/friends.module");
const calls_module_1 = require("../calls/calls.module");
const livekit_module_1 = require("../livekit/livekit.module");
const firebase_module_1 = require("../firebase/firebase.module");
let SocketModule = class SocketModule {
};
exports.SocketModule = SocketModule;
exports.SocketModule = SocketModule = __decorate([
    (0, common_1.Module)({
        imports: [
            users_module_1.UsersModule,
            (0, common_1.forwardRef)(() => chat_module_1.ChatModule),
            redis_module_1.RedisModule,
            matches_module_1.MatchesModule,
            (0, common_1.forwardRef)(() => friends_module_1.FriendsModule),
            calls_module_1.CallsModule,
            livekit_module_1.LivekitModule,
            firebase_module_1.FirebaseModule,
        ],
        providers: [socket_gateway_1.SocketGateway],
        exports: [socket_gateway_1.SocketGateway],
    })
], SocketModule);
//# sourceMappingURL=socket.module.js.map