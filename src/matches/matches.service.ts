import { Injectable } from '@nestjs/common';

import { RedisService }
from '../redis/redis.service';

import { UsersService }
from '../users/users.service';

@Injectable()
export class MatchService {

  constructor(
    private readonly redisService: RedisService,
    private readonly usersService: UsersService,
  ) {}

  // =========================
  // ADD TO QUEUE
  // =========================

  async addToQueue(
    userId: string,
    gender: string,
  ) {

    gender =
      gender?.toLowerCase();

    if (
      gender !== 'male' &&
      gender !== 'female'
    ) {

      console.log(
        `Invalid gender: ${gender}`,
      );

      return;
    }

    const queue =
      gender === 'male'
        ? 'male_waiting'
        : 'female_waiting';

    // =========================
    // PREVENT DUPLICATES
    // =========================

    const users =
      await this.redisService.smembers(
        queue,
      );

    if (
      users.includes(userId)
    ) {

      await this.redisService.set(
        `queue:${userId}`,
        'true',
        60,
      );

      console.log(
        `User already in queue: ${userId}`,
      );

      return;
    }

    // =========================
    // ADD USER
    // =========================

    await this.redisService.sadd(
      queue,
      userId,
    );

    // =========================
    // STORE TTL
    // =========================

    await this.redisService.set(
      `queue:${userId}`,
      'true',
      60,
    );

    console.log(
      `➕ Added To Queue: ${userId}`,
    );
  }

  // =========================
  // GET RANDOM MATCH
  // =========================

  async getMatch(
    currentUserId: string,
    gender: string,
    preferenceGender?: string,
    preferenceLocation?: string,
  ) {

    // =========================
    // REFRESH CURRENT USER TTL
    // =========================

    await this.redisService.set(
      `queue:${currentUserId}`,
      'true',
      60,
    );

    // =========================
    // VALIDATE BUSY
    // =========================

    const currentUserBusy =
      await this.redisService.isBusy(
        currentUserId,
      );

    if (currentUserBusy) {

      console.log(
        `Current user already busy: ${currentUserId}`,
      );

      return null;
    }

    // =========================
    // VALIDATE GENDER
    // =========================

    gender =
      gender?.toLowerCase();

    if (
      gender !== 'male' &&
      gender !== 'female'
    ) {

      console.log(
        `Invalid gender: ${gender}`,
      );

      return null;
    }

    let targetGenders: string[] = [];
    if (preferenceGender?.toLowerCase() === 'female') {
      targetGenders = ['female'];
    } else if (preferenceGender?.toLowerCase() === 'male') {
      targetGenders = ['male'];
    } else if (preferenceGender?.toLowerCase() === 'both') {
      targetGenders = ['male', 'female'];
    } else {
      // Default fallback
      targetGenders = [gender === 'male' ? 'female' : 'male'];
    }

    const oppositeQueues = targetGenders.map(g => g === 'male' ? 'male_waiting' : 'female_waiting');

    // =========================
    // GET USERS FROM QUEUE
    // =========================

    let queueUsers: string[] = [];
    for (const queue of oppositeQueues) {
      const qUsers = await this.redisService.smembers(queue);
      queueUsers = queueUsers.concat(qUsers);
    }

    let users = [...queueUsers];

    // =========================
    // FALLBACK TO ONLINE USERS
    // =========================

    if (!users.length) {
      console.log(
        `No users in queues: ${oppositeQueues.join(', ')}. Checking online users ready for calls.`,
      );
      for (const tGender of targetGenders) {
        const oUsers = await this.redisService.smembers(`online_calls:${tGender}`);
        users = users.concat(oUsers);
      }
    }

    if (!users.length) {
      console.log(
        `No online/waiting users found for genders: ${targetGenders.join(', ')}`,
      );

      await this.redisService.set(
        `queue:${currentUserId}`,
        'true',
        60,
      );

      return null;
    }

    // =========================
    // GET CURRENT USER LOCATION
    // =========================

    let currentUserCity: string | null = null;
    if (preferenceLocation?.toLowerCase() === 'nearby') {
      const currentUser = await this.usersService.findById(currentUserId);
      currentUserCity = currentUser?.city || null;
    }

    // =========================
    // RANDOMIZE USERS
    // =========================

    const shuffledUsers =
      [...users];

    for (
      let i =
        shuffledUsers.length - 1;
      i > 0;
      i--
    ) {

      const j =
        Math.floor(
          Math.random() *
          (i + 1),
        );

      [
        shuffledUsers[i],
        shuffledUsers[j],
      ] = [
        shuffledUsers[j],
        shuffledUsers[i],
      ];
    }

    // =========================
    // FIND VALID MATCH
    // =========================

    for (const userId of shuffledUsers) {

      // =========================
      // PREVENT SELF MATCH
      // =========================

      if (
        userId === currentUserId
      ) {
        continue;
      }

      // =========================
      // SKIP BUSY USERS
      // =========================

      const busy =
        await this.redisService.isBusy(
          userId,
        );

      if (busy) {

        console.log(
          `Busy user skipped: ${userId}`,
        );

        continue;
      }

      // =========================
      // SKIP MATCHED USERS
      // =========================

      const matched =
        await this.redisService.getMatched(
          userId,
        );

      if (matched) {

        console.log(
          `Matched user skipped: ${userId}`,
        );

        continue;
      }

      // =========================
      // CHECK MATCH LOCK
      // =========================

      const matching =
        await this.redisService.get(
          `matching:${userId}`,
        );

      if (matching) {

        console.log(
          `Matching lock active: ${userId}`,
        );

        continue;
      }

      // =========================
      // CHECK SOCKET
      // =========================

      const socketId =
        await this.redisService.get(
          `socket:${userId}`,
        );

      if (!socketId) {

        console.log(
          `No socket for user: ${userId}`,
        );

        // CLEAN STALE USER
        for (const queue of oppositeQueues) {
          await this.redisService.srem(
            queue,
            userId,
          );
        }

        await this.redisService.del(
          `queue:${userId}`,
        );

        continue;
      }

      // =========================
      // FILTER BY LOCATION (Nearby)
      // =========================
      if (preferenceLocation?.toLowerCase() === 'nearby' && currentUserCity) {
        const candidate = await this.usersService.findById(userId);
        if (!candidate || !candidate.city || candidate.city.toLowerCase().trim() !== currentUserCity.toLowerCase().trim()) {
          console.log(`Candidate ${userId} skipped due to city mismatch or missing city`);
          continue;
        }
      }

      // =========================
      // CHECK QUEUE TTL (only for queue-based matches)
      // =========================

      const isFromQueue = queueUsers.includes(userId);
      if (isFromQueue) {
        const queueAlive =
          await this.redisService.get(
            `queue:${userId}`,
          );

        if (!queueAlive) {

          console.log(
            `Queue expired: ${userId}`,
          );

          for (const queue of oppositeQueues) {
            await this.redisService.srem(
              queue,
              userId,
            );
          }

          await this.redisService.del(
            `queue:${userId}`,
          );

          continue;
        }
      }

      // =========================
      // REFRESH TARGET TTL
      // =========================

      await this.redisService.set(
        `queue:${userId}`,
        'true',
        60,
      );

      // =========================
      // CREATE TEMP MATCH LOCKS
      // =========================

      await this.redisService.set(
        `matching:${userId}`,
        'true',
        15,
      );

      await this.redisService.set(
        `matching:${currentUserId}`,
        'true',
        15,
      );

      console.log(
        `🎯 Match Found: ${currentUserId} ↔ ${userId}`,
      );

      return userId;
    }

    // =========================
    // NO VALID MATCH
    // =========================

    console.log(
      `No valid match found for: ${currentUserId}`,
    );

    await this.redisService.set(
      `queue:${currentUserId}`,
      'true',
      60,
    );

    return null;
  }

  // =========================
  // REMOVE FROM QUEUE
  // =========================

  async removeFromQueue(
    userId: string,
    gender: string,
  ) {

    gender =
      gender?.toLowerCase();

    if (
      gender !== 'male' &&
      gender !== 'female'
    ) {

      console.log(
        `Invalid gender: ${gender}`,
      );

      return;
    }

    const queue =
      gender === 'male'
        ? 'male_waiting'
        : 'female_waiting';

    // =========================
    // REMOVE USER
    // =========================

    await this.redisService.srem(
      queue,
      userId,
    );

    // =========================
    // CLEAR TTL
    // =========================

    await this.redisService.del(
      `queue:${userId}`,
    );

    console.log(
      `➖ Removed From Queue: ${userId}`,
    );
  }
}