import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import {
  Repository,
  In,
} from 'typeorm';

import { User } from './users.entity';

import { RedisService }
from '../redis/redis.service';

@Injectable()
export class UsersService {

  constructor(

    @InjectRepository(User)
    private userRepo: Repository<User>,

    private redisService: RedisService,

  ) {}

  // =========================
  // FIND BY PHONE
  // =========================

  async findByPhone(
    phone: string,
  ) {

    return this.userRepo.findOne({
      where: { phone },
    });
  }

  // =========================
  // FIND BY EMAIL
  // =========================

  async findByEmail(
    email: string,
  ) {

    return this.userRepo.findOne({
      where: { email },
    });
  }

  // =========================
  // FIND BY ID
  // =========================

    // =========================
  // FIND BY ID
  // =========================

  async findById(
    id: number | string,
  ) {

    if (
      id === null ||
      id === undefined ||
      id === ''
    ) {

      console.log(
        '[findById] Missing ID:',
        id,
      );

      return null;
    }

    const userId =
        Number(id);

    if (
      isNaN(userId) ||
      userId <= 0
    ) {

      console.log(
        '[findById] Invalid ID:',
        id,
      );

      return null;
    }

    return this.userRepo.findOne({
      where: {
        id: userId,
      },
    });
  }

  // =========================
  // CREATE USER
  // =========================

  async createUser(
    data: Partial<User>,
  ) {

    const user =
      this.userRepo.create(data);

    return this.userRepo.save(
      user,
    );
  }

  // =========================
  // UPDATE USERt
  // =========================

  async updateUser(
    id: number | string,
    updates: Partial<User>,
  ) {

    const userId =
      Number(id);

    console.log(
      '[updateUser]',
      userId,
    );

    if (
      isNaN(userId) ||
      userId <= 0
    ) {

      throw new Error(
        `Invalid user ID: ${id}`,
      );
    }

    const user =
      await this.findById(
        userId,
      );

    if (!user) {

      throw new Error(
        'User not found',
      );
    }

    // =========================
    // DOB → AGE CALCULATION
    // =========================

    if (updates.dob) {

      const dob =
        new Date(
          updates.dob,
        );

      const today =
        new Date();

      let age =
        today.getFullYear() -
        dob.getFullYear();

      const monthDiff =
        today.getMonth() -
        dob.getMonth();

      if (
        monthDiff < 0 ||
        (
          monthDiff === 0 &&
          today.getDate() <
          dob.getDate()
        )
      ) {
        age--;
      }

      // 18+ validation
      if (age < 18) {

        throw new Error(
          'This is an 18+ app',
        );
      }

      updates.age = age;
    }

    // =========================
    // PROFILE REWARD
    // =========================

    if (
      updates.profileCompleted &&
      !user.profileCompleted
    ) {

      updates.coins =
        (user.coins || 0) + 50;
    }

    // =========================
    // UPDATE USER
    // =========================

    await this.userRepo.update(
      userId,
      updates,
    );

    return this.findById(
      userId,
    );
  }

  // =========================
  // UPDATE COINS
  // =========================

  async updateCoins(
    userId: number | string,
    amount: number,
  ) {

    const user =
      await this.findById(
        userId,
      );

    if (!user) {

      throw new Error(
        'User not found',
      );
    }

    const updatedCoins =
      Math.max(
        0,
        (user.coins || 0) + amount,
      );

    await this.userRepo.update(
      Number(userId),
      {
        coins: updatedCoins,
      },
    );

    return updatedCoins;
  }

  // =========================
  // SET USER ONLINE
  // =========================

  async setUserOnline(
    userId: number | string,
  ) {

    const user =
      await this.findById(
        userId,
      );

    if (!user) {
      return;
    }

    const id =
      String(user.id);

    // general online users
    await this.redisService.sadd(
      'online_users',
      id,
    );

    // gender online users
    if (
      user.gender?.toLowerCase() ===
      'male'
    ) {

      await this.redisService.sadd(
        'online:male',
        id,
      );
    }
    
    if (
      user.gender?.toLowerCase() ===
      'female'
    ) {

      await this.redisService.sadd(
        'online:female',
        id,
      );
    }

    // update DB
    await this.userRepo.update(
      user.id,
      {
        isOnline: true,
        lastActiveAt:
          new Date(),
      },
    );

    console.log(
      `✅ User Online: ${id}`,
    );
  }

  // =========================
  // SET USER OFFLINE
  // =========================

  async setUserOffline(
    userId: number | string,
  ) {

    const user =
      await this.findById(
        userId,
      );

    if (!user) {
      return;
    }

    const id =
      String(user.id);

    // remove online users
    await this.redisService.srem(
      'online_users',
      id,
    );

    // remove gender online
    if (
      user.gender?.toLowerCase() ===
      'male'
    ) {

      await this.redisService.srem(
        'online:male',
        id,
      );
    }

    if (
      user.gender?.toLowerCase() ===
      'female'
    ) {

      await this.redisService.srem(
        'online:female',
        id,
      );
    }

    // update DB
    await this.userRepo.update(
      user.id,
      {
        isOnline: false,
        lastActiveAt:
          new Date(),
      },
    );

    console.log(
      `❌ User Offline: ${id}`,
    );
  }

  // =========================
  // GET ONLINE USERS
  // =========================

 async getOnlineUsers() {

  const onlineUserIds =
    await this.redisService.smembers(
      'online_users',
    );

  console.log(
    'REDIS ONLINE USERS:',
    onlineUserIds,
  );

  // =========================
  // FALLBACK TO DB
  // =========================

  if (
    !onlineUserIds ||
    onlineUserIds.length === 0
  ) {

    console.log(
      'Redis empty → loading from DB',
    );

    return this.userRepo.find({

      where: {
        isOnline: true,
        profileCompleted: true,
      },

      select: [
        'id',
        'name',
        'age',
        'gender',
        'imageUrl',
        'city',
        'coins',
        'isOnline',
        'country',
        'bio',
        'interests',
        'isVerified',
        'likesCount',
        'followersCount',
        'role',
      ],
    });
  }

  // =========================
  // REDIS USERS
  // =========================

  const ids =
    onlineUserIds

      .map((id) => Number(id))

      .filter(
        (id) =>
          !isNaN(id) &&
          id > 0,
      );

  return this.userRepo.find({

    where: {
      id: In(ids),
    },

    select: [
      'id',
      'name',
      'age',
      'gender',
      'imageUrl',
      'city',
      'coins',
      'isOnline',
      'country',
      'bio',
      'interests',
      'isVerified',
      'likesCount',
      'followersCount',
      'role',
    ],
  });
}

  // =========================
  // GET ACTIVE LIVE HOSTS
  // =========================

  async getActiveLiveHosts() {
    return this.userRepo.find({
      where: {
        isLive: true,
      },
      select: [
        'id',
        'name',
        'age',
        'gender',
        'imageUrl',
        'city',
        'country',
        'coins',
        'isOnline',
        'viewerCount',
        'likesCount',
        'liveStartedAt',
        'liveLikes',
        'liveCoins',
      ],
    });
  }

  // =========================
  // GET RANDOM MATCH
  // =========================

  async getRandomMatch(
    currentUserId: number,
  ) {

    const currentUser =
      await this.findById(
        currentUserId,
      );

    if (!currentUser) {

      throw new Error(
        'User not found',
      );
    }

    if (!currentUser.isActive) {

      throw new Error(
        'User inactive',
      );
    }

    let targetGender = '';

    if (
      currentUser.gender
        ?.toLowerCase() ===
      'male'
    ) {

      targetGender =
        'female';
    }

    if (
      currentUser.gender
        ?.toLowerCase() ===
      'female'
    ) {

      targetGender =
        'male';
    }

    const onlineUsers =
      await this.redisService.smembers(
        `online:${targetGender}`,
      );

   const filteredUsers: string[] = [];

    for (const id of onlineUsers) {

      // skip self
      if (
        Number(id) ===
        currentUserId
      ) {
        continue;
      }

      // skip busy users
      const busy =
        await this.redisService.isBusy(
          id,
        );

      if (busy) {
        continue;
      }

      // skip matched users
      const matched =
        await this.redisService.getMatched(
          id,
        );

      if (matched) {
        continue;
      }

      filteredUsers.push(
        id,
      );
    }

    if (
      filteredUsers.length === 0
    ) {

      return null;
    }

    // random selection
    const randomUserId =
      filteredUsers[
        Math.floor(
          Math.random() *
          filteredUsers.length,
        )
      ];

    return this.findById(
      Number(randomUserId),
    );
  }

   // =========================
  // PUBLIC PROFILE
  // =========================

  async getPublicProfile(
    userId: number,
  ) {

    // Validate user ID
    if (
      isNaN(userId) ||
      userId <= 0
    ) {

      console.log(
        '[getPublicProfile] Invalid user ID:',
        userId,
      );

      return null;
    }

    return this.userRepo.findOne({

      where: {
        id: userId,
      },

      select: [
        'id',
        'name',
        'age',
        'gender',
        'imageUrl',
        'bio',
        'city',
        'country',
        'isOnline',
        'isVerified',
      ],
    });
  }

  // =========================
  // SET USER ONLINE FOR CALLS
  // =========================
  async setUserOnlineForCalls(userId: number | string) {
    const user = await this.findById(userId);
    if (!user) return;
    const id = String(user.id);

    await this.redisService.sadd('online_users', id);
    const gender = user.gender?.toLowerCase();
    if (gender) {
      await this.redisService.sadd(`online_calls:${gender}`, id);
    }

    await this.userRepo.update(user.id, {
      isOnline: true,
      lastActiveAt: new Date(),
    });
    console.log(`✅ User Online for Calls: ${id}`);
  }

  // =========================
  // SET USER OFFLINE FOR CALLS
  // =========================
  async setUserOfflineForCalls(userId: number | string) {
    const user = await this.findById(userId);
    if (!user) return;
    const id = String(user.id);

    const gender = user.gender?.toLowerCase();
    if (gender) {
      await this.redisService.srem(`online_calls:${gender}`, id);
    }

    // Notice we do NOT set isOnline: false in the DB here,
    // because they might still be online for chat/swiping.
    console.log(`❌ User Offline for Calls: ${id}`);
  }
}