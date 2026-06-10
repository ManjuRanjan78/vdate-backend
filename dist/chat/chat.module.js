"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const chat_service_1 = require("./chat.service");
const chat_controller_1 = require("./chat.controller");
const chat_gateway_1 = require("./chat.gateway");
const chat_room_entity_1 = require("./entities/chat-room.entity");
const chat_message_entity_1 = require("./entities/chat-message.entity");
const users_entity_1 = require("../users/users.entity");
const message_template_entity_1 = require("./entities/message-template.entity");
const friend_entity_1 = require("../friends/entities/friend.entity");
const friendship_entity_1 = require("../friends/entities/friendship.entity");
const friends_module_1 = require("../friends/friends.module");
let ChatModule = class ChatModule {
};
exports.ChatModule = ChatModule;
exports.ChatModule = ChatModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([users_entity_1.User, message_template_entity_1.MessageTemplate, friend_entity_1.Friend, friendship_entity_1.Friendship, chat_room_entity_1.ChatRoom, chat_message_entity_1.ChatMessage]),
            (0, common_1.forwardRef)(() => friends_module_1.FriendsModule),
        ],
        controllers: [chat_controller_1.ChatController],
        providers: [chat_service_1.ChatService, chat_gateway_1.ChatGateway],
        exports: [chat_service_1.ChatService],
    })
], ChatModule);
//# sourceMappingURL=chat.module.js.map