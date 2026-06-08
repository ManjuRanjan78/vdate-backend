import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Req,
  Logger,
} from '@nestjs/common';

import { UsersService } from './users.service';

@Controller('user')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(
    private usersService: UsersService,
  ) {}

  @Get('me')
  async getCurrentUser(
    @Req() req: any,
  ) {
    const user =
      await this.usersService.findById(
        req.user.userId,
      );

    return this.transformUserResponse(
      user,
    );
  }

  @Post('update')
  async updateUser(
    @Body() body: any,
    @Req() req: any,
  ) {
    // Get user ID from JWT token
    const userId = req.user?.userId;

    if (!userId) {
      throw new Error(
        'User ID not found in authentication token',
      );
    }

    // Prepare updates
    const updates: any = {
      name: body.name ?? body.displayName,
      gender: body.gender,
      imageUrl: body.imageUrl,
      bio: body.bio,
      country: body.country,
      city: body.city,
      latitude: body.latitude,
      longitude: body.longitude,
      location: body.location,
      role: body.role,
      interests: body.interests,
      profileCompleted: body.profileCompleted,
    };

    if (body.isOnline !== undefined) {
      updates.isOnline = body.isOnline;
    }

    if (body.fcmToken !== undefined) {
      updates.fcmToken = body.fcmToken;
      this.logger.log(
        `Updating FCM token for user ${userId}`,
      );
    }

    // Map dateOfBirth/dob -> dob
    if (body.dateOfBirth) {
      updates.dob = body.dateOfBirth;
    } else if (body.dob) {
      updates.dob = body.dob;
    }

    if (body.isOnline === true) {
      updates.lastActiveAt = new Date();
    }

    // Remove age from updates if present
    delete updates.age;

    const updatedUser =
      await this.usersService.updateUser(
        userId,
        updates,
      );

    return this.transformUserResponse(
      updatedUser,
    );
  }

  /**
   * IMPORTANT:
   * Keep fixed routes ABOVE :id route
   * Otherwise "feed" becomes ":id"
   */

 @Get('feed')
async getFeed() {
  return await this.usersService.getOnlineUsers();
}

@Get('live/active')
async getActiveLiveStreams() {
  const active = await this.usersService.getActiveLiveHosts();
  return active.map(u => this.transformUserResponse(u));
}


// =========================
// RANDOM MATCH
// =========================

@Get('random-match/:userId')
async getRandomMatch(
  @Param('userId') userId: string,
) {

  // Validate
  if (
    !userId ||
    userId === 'null' ||
    userId === 'undefined'
  ) {

    return {
      statusCode: 400,
      message:
          'User ID missing',
    };
  }

  const id =
      Number(userId);

  // Invalid number
  if (
    isNaN(id) ||
    id <= 0
  ) {

    return {
      statusCode: 400,
      message:
          'Invalid user ID',
    };
  }

  // Get random opposite gender match
  const match =
      await this.usersService
          .getRandomMatch(id);

  // No users found
  if (!match) {

    return {
      statusCode: 404,
      message:
          'No online users available',
    };
  }

  // Return transformed response
  return this.transformUserResponse(
    match,
  );
}

 @Post('online-status')
async updateOnlineStatus(
  @Body() body: any,
  @Req() req: any,
) {
  const userId =
    body.userId || req.user?.userId;

  if (!userId) {
    return {
      statusCode: 400,
      message: 'User ID required',
    };
  }

  if (body.isOnline) {
    await this.usersService.setUserOnline(userId);
  } else {
    await this.usersService.setUserOffline(userId);
  }

  return {
    success: true,
    isOnline: body.isOnline,
  };
}

  @Get(':id')
  async getUser(
    @Param('id') id: string,
  ) {
   if (
  !id ||
  id === 'null' ||
  id === 'undefined'
) {

  console.log(
    'User ID missing',
  );

  return {
    statusCode: 400,
    message:
      'User ID missing',
  };
}

    // Convert to number
    const userId =
      Number(id);

    // Check valid number
    if (
      isNaN(userId) ||
      userId <= 0
    ) {
      console.log(
        'Invalid User ID:',
        id,
      );

      return {
        statusCode: 400,
        message:
          'Invalid user id',
      };
    }

    const user =
      await this.usersService.findById(
        userId,
      );

    if (!user) {
      return {
        statusCode: 404,
        message:
          'User not found',
      };
    }

    return this.transformUserResponse(
      user,
    );
  }

  private transformUserResponse(
    user: any,
  ) {
    if (!user) {
      return null;
    }

    const response = {
      ...user,
    };

    // Map dob -> dateOfBirth
    if (user.dob) {
      response.dateOfBirth =
        user.dob;

      // Calculate age
      const birthDate =
        new Date(user.dob);

      const today =
        new Date();

      let age =
        today.getFullYear() -
        birthDate.getFullYear();

      const monthDiff =
        today.getMonth() -
        birthDate.getMonth();

      if (
        monthDiff < 0 ||
        (
          monthDiff === 0 &&
          today.getDate() <
            birthDate.getDate()
        )
      ) {
        age--;
      }

      response.age = age;
    }

    // Remove internal field
    delete response.dob;

    return response;
  }
}