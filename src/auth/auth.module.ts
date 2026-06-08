import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TwilioService } from './twilio.service';
import { UsersModule } from '../users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RefreshToken } from './dto/refresh-token.entity';

@Module({
  imports: [
    UsersModule,

    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'SECRET_KEY',
      signOptions: {
        expiresIn: '15m',
      },
    }),
    TypeOrmModule.forFeature([RefreshToken]),
  ],

  controllers: [AuthController],
  providers: [AuthService, TwilioService],
})
export class AuthModule {}
