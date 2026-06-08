import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { RefreshToken } from './dto/refresh-token.entity';
import { TwilioService } from './twilio.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const mockRefreshRepo = { save: jest.fn() };
    const mockTwilio = {};
    const mockUsers = { findByPhone: jest.fn(), createUser: jest.fn(), findByEmail: jest.fn(), updateUser: jest.fn(), findById: jest.fn() };
    const mockJwt = { sign: jest.fn(() => 'token'), verify: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(RefreshToken), useValue: mockRefreshRepo },
        { provide: TwilioService, useValue: mockTwilio },
        { provide: UsersService, useValue: mockUsers },
        { provide: JwtService, useValue: mockJwt },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
