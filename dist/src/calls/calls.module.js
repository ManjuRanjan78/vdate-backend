"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CallsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const calls_controller_1 = require("./calls.controller");
const calls_service_1 = require("./calls.service");
const redis_module_1 = require("../redis/redis.module");
const users_entity_1 = require("../users/users.entity");
const call_history_module_1 = require("../call-history/call-history.module");
let CallsModule = class CallsModule {
};
exports.CallsModule = CallsModule;
exports.CallsModule = CallsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            redis_module_1.RedisModule,
            call_history_module_1.CallHistoryModule,
            typeorm_1.TypeOrmModule.forFeature([
                users_entity_1.User,
            ]),
        ],
        controllers: [calls_controller_1.CallsController],
        providers: [calls_service_1.CallsService],
        exports: [calls_service_1.CallsService],
    })
], CallsModule);
//# sourceMappingURL=calls.module.js.map