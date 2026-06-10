"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const auth_module_1 = require("./auth/auth.module");
const config_1 = require("@nestjs/config");
const auth_middleware_1 = require("./auth/auth.middleware");
const users_module_1 = require("./users/users.module");
const balance_module_1 = require("./balance/balance.module");
const transactions_module_1 = require("./transactions/transactions.module");
const matches_module_1 = require("./matches/matches.module");
const history_module_1 = require("./history/history.module");
const calls_module_1 = require("./calls/calls.module");
const chat_module_1 = require("./chat/chat.module");
const redis_module_1 = require("./redis/redis.module");
const livekit_module_1 = require("./livekit/livekit.module");
const friends_module_1 = require("./friends/friends.module");
const socket_module_1 = require("./socket/socket.module");
const firebase_module_1 = require("./firebase/firebase.module");
const notifications_module_1 = require("./notifications/notifications.module");
const payments_module_1 = require("./payments/payments.module");
const call_history_module_1 = require("./call-history/call-history.module");
const posts_module_1 = require("./posts/posts.module");
const reports_module_1 = require("./reports/reports.module");
let AppModule = class AppModule {
    configure(consumer) {
        consumer
            .apply(auth_middleware_1.AuthMiddleware)
            .exclude({ path: 'auth', method: common_1.RequestMethod.ALL }, { path: 'auth/(.*)', method: common_1.RequestMethod.ALL }, { path: 'user/feed', method: common_1.RequestMethod.GET })
            .forRoutes({ path: '*', method: common_1.RequestMethod.ALL });
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forRoot({
                type: 'postgres',
                host: 'localhost',
                port: 5432,
                username: 'postgres',
                password: 'Najnar@420',
                database: 'dating_app',
                autoLoadEntities: true,
                synchronize: true,
                migrations: [__dirname + '/migrations/*.ts', __dirname + '/migrations/*.js'],
                migrationsRun: false,
            }),
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            balance_module_1.BalanceModule,
            transactions_module_1.TransactionsModule,
            matches_module_1.MatchesModule,
            history_module_1.HistoryModule,
            calls_module_1.CallsModule,
            chat_module_1.ChatModule,
            redis_module_1.RedisModule,
            livekit_module_1.LivekitModule,
            friends_module_1.FriendsModule,
            firebase_module_1.FirebaseModule,
            socket_module_1.SocketModule,
            notifications_module_1.NotificationsModule,
            payments_module_1.PaymentsModule,
            call_history_module_1.CallHistoryModule,
            posts_module_1.PostsModule,
            reports_module_1.ReportsModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map