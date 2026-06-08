import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: Partial<Record<keyof UsersService, jest.Mock>>;

  beforeEach(async () => {
    usersService = {
      updateUser: jest.fn().mockResolvedValue({
        id: 1,
        isOnline: true,
        profileCompleted: true,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: usersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should forward isOnline to updateUser and set lastActiveAt when online status is true', async () => {
    const body = {
      isOnline: true,
      profileCompleted: true,
    };

    const req: any = {
      user: {
        userId: '1',
      },
    };

    await controller.updateUser(body, req);

    expect(usersService.updateUser).toHaveBeenCalledTimes(1);
    expect(usersService.updateUser).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({
        isOnline: true,
        profileCompleted: true,
        lastActiveAt: expect.any(Date),
      }),
    );
  });
});
