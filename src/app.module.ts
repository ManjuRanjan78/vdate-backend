import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { AuthMiddleware } from './auth/auth.middleware';
import { UsersModule } from './users/users.module';
import { BalanceModule } from './balance/balance.module';
import { TransactionsModule } from './transactions/transactions.module';
import { MatchesModule } from './matches/matches.module';
import { HistoryModule } from './history/history.module';
import { CallsModule } from './calls/calls.module';
import { ChatModule } from './chat/chat.module';
import { RedisModule } from './redis/redis.module';
import { LivekitModule } from './livekit/livekit.module';
import { FriendsModule } from './friends/friends.module';
import { SocketModule } from './socket/socket.module';
import { FirebaseModule } from './firebase/firebase.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PaymentsModule } from './payments/payments.module';
import { CallHistoryModule } from './call-history/call-history.module';
import { PostsModule } from './posts/posts.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'Najnar@420',
      database: 'dating_app',
      autoLoadEntities: true,
      // Use migrations in staging/production. Disable synchronize for safety.
      synchronize: true,
      migrations: [__dirname + '/migrations/*.ts', __dirname + '/migrations/*.js'],
      migrationsRun: false,
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    AuthModule,
    UsersModule,
    BalanceModule,
    TransactionsModule,
    MatchesModule,
    HistoryModule,
    CallsModule,
    ChatModule,
    RedisModule,
    LivekitModule,
    FriendsModule,
    FirebaseModule,
    SocketModule,
    NotificationsModule,
    PaymentsModule,
    CallHistoryModule,
    PostsModule,
    ReportsModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude(
        { path: 'auth', method: RequestMethod.ALL },
        { path: 'auth/(.*)', method: RequestMethod.ALL },
        { path: 'user/feed', method: RequestMethod.GET },
      )
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
