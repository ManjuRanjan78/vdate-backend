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

  private normalizePreferenceGender(
    preferenceGender?: string | null,
  ): 'male' | 'female' | 'everyone' | 'unknown' {
    if (
      preferenceGender === undefined ||
      preferenceGender === null
    ) {
      console.log('PREFERENCE_NORMALIZED', {
        original: preferenceGender,
        normalized: 'unknown',
      });
      return 'unknown';
    }

    const normalized =
      preferenceGender
        .toLowerCase()
        .trim();

    let result: 'male' | 'female' | 'everyone' | 'unknown';
    if (normalized === 'male') {
      result = 'male';
    } else if (normalized === 'female') {
      result = 'female';
    } else if (
      normalized === 'everyone' ||
      normalized === 'both' ||
      normalized === ''
    ) {
      result = 'everyone';
    } else {
      result = 'unknown';
    }

    console.log('PREFERENCE_NORMALIZED', {
      original: preferenceGender,
      normalized: result,
    });

    return result;
  }

  private getAcceptedGenders(
    gender: string,
    preferenceGender?: string | null,
  ): string[] {
    const normalizedGender =
      gender?.toLowerCase().trim();
    const normalizedPreference =
      this.normalizePreferenceGender(
        preferenceGender,
      );

    let targetGenders: string[];

    if (normalizedPreference === 'female') {
      targetGenders = ['female'];
    } else if (normalizedPreference === 'male') {
      targetGenders = ['male'];
    } else if (normalizedPreference === 'everyone') {
      targetGenders = ['male', 'female'];
    } else {
      const defaultTarget =
        normalizedGender === 'male'
          ? 'female'
          : 'male';
      targetGenders = [defaultTarget];
    }

    console.log('MATCH_PREF_RESOLVED', {
      userGender: normalizedGender,
      preferenceGender,
      normalizedPreference,
      targetGenders,
    });

    console.log('TARGET_GENDERS_RESOLVED', {
      targetGenders,
    });

    return targetGenders;
  }

  isMatchPreferenceCompatible(
    currentUserGender: string,
    currentUserPreference?: string | null,
    candidateGender?: string,
    candidatePreference?: string | null,
  ): boolean {
    console.log('PREFERENCE_COMPATIBILITY_CHECK', {
      currentUserGender,
      currentUserPreference,
      candidateGender,
      candidatePreference,
    });

    console.log(
      'PREFERENCE_FILTER_START',
      {
        currentUserGender,
        currentUserPreference,
        candidateGender,
        candidatePreference,
      }
    );

    if (!candidateGender) {
      console.log('PREFERENCE_FILTER_RESULT', { success: false, reason: 'No candidate gender' });
      console.log('PREFERENCE_COMPATIBILITY_RESULT', {
        compatible: false,
        currentUserGender,
        currentUserPreference,
        candidateGender,
        candidatePreference,
      });
      return false;
    }

    const normalizedCandidateGender =
      candidateGender.toLowerCase().trim();
    const normalizedCurrentGender =
      currentUserGender.toLowerCase().trim();

    if (normalizedCurrentGender === normalizedCandidateGender) {
      console.log('SAME_GENDER_MATCH_CHECK', {
        currentUserGender: normalizedCurrentGender,
        currentUserPreference,
        candidateGender: normalizedCandidateGender,
        candidatePreference,
      });
    }

    const currentAccepts = this.getAcceptedGenders(
      normalizedCurrentGender,
      currentUserPreference,
    );

    const candidateAccepts = this.getAcceptedGenders(
      normalizedCandidateGender,
      candidatePreference,
    );

    const acceptsEachOther =
      currentAccepts.includes(
        normalizedCandidateGender,
      ) &&
      candidateAccepts.includes(
        normalizedCurrentGender,
      );

    if (acceptsEachOther) {
      console.log('PREFERENCE_MATCH_SUCCESS', {
        currentUserGender: normalizedCurrentGender,
        currentUserPreference,
        candidateGender: normalizedCandidateGender,
        candidatePreference,
      });
    } else {
      console.log('PREFERENCE_MATCH_REJECT', {
        currentUserGender: normalizedCurrentGender,
        currentUserPreference,
        candidateGender: normalizedCandidateGender,
        candidatePreference,
      });
    }

    if (!acceptsEachOther) {
      console.log(
        'PREFERENCE_FILTER_REJECTED',
        {
          currentUserGender: normalizedCurrentGender,
          currentUserPreference,
          candidateGender: normalizedCandidateGender,
          candidatePreference,
          currentAccepts,
          candidateAccepts,
        },
      );
    }

    console.log('PREFERENCE_FILTER_RESULT', { success: acceptsEachOther, currentAccepts, candidateAccepts });

    console.log('PREFERENCE_COMPATIBILITY_RESULT', {
      compatible: acceptsEachOther,
      currentUserGender,
      currentUserPreference,
      candidateGender,
      candidatePreference,
    });

    return acceptsEachOther;
  }

  private getQueuePreferenceKey(
    userId: string,
    field: 'gender' | 'location',
  ) {
    return `queue_preference_${field}:${userId}`;
  }

  private async setQueuePreferences(
    userId: string,
    preferenceGender?: string | null,
    preferenceLocation?: string | null,
  ) {
    if (
      preferenceGender !== undefined &&
      preferenceGender !== null
    ) {
      console.log('PREFERENCE_SELECTED', {
        userId,
        preferenceGender,
        preferenceLocation,
      });
      await this.redisService.set(
        this.getQueuePreferenceKey(
          userId,
          'gender',
        ),
        preferenceGender,
        120,
      );
      // Persistent fallback key for same-gender matching (expires in 24 hours)
      await this.redisService.set(
        `user_preference_gender:${userId}`,
        preferenceGender,
        86400,
      );
    }

    if (
      preferenceLocation !== undefined &&
      preferenceLocation !== null
    ) {
      await this.redisService.set(
        this.getQueuePreferenceKey(
          userId,
          'location',
        ),
        preferenceLocation,
        120,
      );
    }
  }

  private async clearQueuePreferences(
    userId: string,
  ) {
    await this.redisService.del(
      this.getQueuePreferenceKey(
        userId,
        'gender',
      ),
    );
    await this.redisService.del(
      this.getQueuePreferenceKey(
        userId,
        'location',
      ),
    );
  }

  async getQueuePreferenceGender(
    userId: string,
  ): Promise<string | null> {
    const queuePref = await this.redisService.get(
      this.getQueuePreferenceKey(
        userId,
        'gender',
      ),
    );
    if (queuePref !== null) {
      return queuePref;
    }
    // Fall back to persistent preference key if queue preference key expired
    return await this.redisService.get(`user_preference_gender:${userId}`);
  }

  async getQueuePreferenceLocation(
    userId: string,
  ): Promise<string | null> {
    return await this.redisService.get(
      this.getQueuePreferenceKey(
        userId,
        'location',
      ),
    );
  }

  // =========================
  // ADD TO QUEUE
  // =========================

  async addToQueue(
    userId: string,
    gender: string,
    preferenceGender?: string | null,
    preferenceLocation?: string | null,
  ) {
    console.log(
      'AUDIT_QUEUE_INSERT_START',
      {
        userId,
        gender,
        preferenceGender,
        preferenceLocation,
      },
    );

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

    console.log(
      'AUDIT_QUEUE_CHECK_DUPLICATES',
      {
        userId,
        queue,
        usersInQueue: users,
        isDuplicate: users.includes(userId),
      },
    );

    if (
      users.includes(userId)
    ) {

      await this.redisService.set(
        `queue:${userId}`,
        'true',
        60,
      );

      await this.setQueuePreferences(
        userId,
        preferenceGender,
        preferenceLocation,
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

    await this.setQueuePreferences(
      userId,
      preferenceGender,
      preferenceLocation,
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

    console.log('QUEUE_JOINED', {
      userId,
      gender,
      preferenceGender,
      preferenceLocation,
    });
  }

  // =========================
  // GET RANDOM MATCH
  // =========================

  async getMatch(
    currentUserId: string,
    gender: string,
    preferenceGender?: string | null,
    preferenceLocation?: string | null,
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

    const targetGenders =
      this.getAcceptedGenders(
        gender,
        preferenceGender,
      );

    const oppositeQueues = targetGenders.map(
      (g) =>
        g === 'male'
          ? 'male_waiting'
          : 'female_waiting',
    );

    // =========================
    // GET USERS FROM QUEUE
    // =========================

    console.log(
      'QUEUE_SELECTION',
      {
        currentUserId,
        gender,
        preferenceGender,
        preferenceLocation,
        targetGenders,
        oppositeQueues
      }
    );

    let queueUsers: string[] = [];
    for (const queue of oppositeQueues) {
      const qUsers = await this.redisService.smembers(queue);
      console.log(
        'AUDIT_QUEUE_LOOKUP',
        {
          currentUserId,
          queue,
          usersFound: qUsers,
          count: qUsers.length,
        },
      );
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
        console.log(
          'AUDIT_ONLINE_USERS_LOOKUP',
          {
            currentUserId,
            gender: tGender,
            usersFound: oUsers,
            count: oUsers.length,
          },
        );
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

    console.log(
      'CANDIDATE_QUERY_RESULT',
      {
        currentUserId,
        totalCandidates: users.length,
        candidates: users,
      },
    );

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
      console.log(
        'MATCH_VALIDATION_START',
        {
          currentUserId,
          candidateId: userId,
          candidateIndex: shuffledUsers.indexOf(userId),
          totalCandidates: shuffledUsers.length,
          gender,
          preferenceGender,
          regionMode: preferenceLocation,
        },
      );

      // =========================
      // PREVENT SELF MATCH
      // =========================

      if (
        userId === currentUserId
      ) {
        console.log(
          'CANDIDATE_REJECT_REASON',
          {
            userId: currentUserId,
            candidateId: userId,
            gender,
            preference: preferenceGender,
            isOnline: true,
            isSearching: true,
            isInCall: false,
            regionMode: preferenceLocation,
            rejectionReason: 'Self match',
          },
        );
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
          'CANDIDATE_REJECT_REASON',
          {
            userId: currentUserId,
            candidateId: userId,
            gender,
            preference: preferenceGender,
            isOnline: true,
            isSearching: false,
            isInCall: true,
            regionMode: preferenceLocation,
            rejectionReason: 'Candidate is busy',
          },
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
          'CANDIDATE_REJECT_REASON',
          {
            userId: currentUserId,
            candidateId: userId,
            gender,
            preference: preferenceGender,
            isOnline: true,
            isSearching: true,
            isInCall: false,
            regionMode: preferenceLocation,
            rejectionReason: 'Already matched',
          },
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
      // SKIP RECENT MATCHES
      // =========================

      const hasHistory =
        await this.redisService.hasMatchHistory(
          currentUserId,
          userId,
        );

      if (hasHistory) {

        console.log(
          `Recently matched skipped: ${userId}`,
        );

        continue;
      }

      // =========================
      // CHECK SOCKET & HEARTBEAT
      // =========================

      const socketId =
        await this.redisService.get(
          `socket:${userId}`,
        );

      const heartbeat =
        await this.redisService.get(
          `heartbeat:${userId}`,
        );

      if (!socketId || !heartbeat) {

        console.log(
          'CANDIDATE_REJECT_REASON',
          {
            userId: currentUserId,
            candidateId: userId,
            gender,
            preference: preferenceGender,
            isOnline: false,
            isSearching: false,
            isInCall: false,
            regionMode: preferenceLocation,
            rejectionReason: 'Candidate offline',
          },
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

      const candidate =
        await this.usersService.findById(
          userId,
        );

      if (!candidate || !candidate.gender) {
        console.log(
          'CANDIDATE_REJECT_REASON',
          {
            userId: currentUserId,
            candidateId: userId,
            gender,
            preference: preferenceGender,
            isOnline: true,
            isSearching: true,
            isInCall: false,
            regionMode: preferenceLocation,
            rejectionReason: 'Candidate gender missing',
          },
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

      const candidateGender =
        candidate.gender
          .toLowerCase()
          .trim();

      console.log('CANDIDATE_GENDER', { candidateId: userId, candidateGender });

      const candidatePreference =
        await this.getQueuePreferenceGender(
          userId,
        );

      console.log(
        'AUDIT_PREFERENCE_CHECK',
        {
          currentUserId,
          candidateId: userId,
          currentGender: gender,
          currentPreference: preferenceGender,
          candidateGender,
          candidatePreference,
        },
      );

      if (
        !this.isMatchPreferenceCompatible(
          gender,
          preferenceGender,
          candidateGender,
          candidatePreference,
        )
      ) {
        console.log(
          'CANDIDATE_REJECT_REASON',
          {
            userId: currentUserId,
            candidateId: userId,
            gender,
            preference: preferenceGender,
            isOnline: true,
            isSearching: true,
            isInCall: false,
            regionMode: preferenceLocation,
            rejectionReason: 'Gender preference mismatch',
          },
        );

        continue;
      }

      // =========================
      // FILTER BY LOCATION (Nearby)
      // =========================
      if (
        preferenceLocation?.toLowerCase() ===
          'nearby' &&
        currentUserCity
      ) {
        if (
          !candidate.city ||
          candidate.city
            .toLowerCase()
            .trim() !==
            currentUserCity
              .toLowerCase()
              .trim()
        ) {
          console.log(
            'CANDIDATE_REJECT_REASON',
            {
              userId: currentUserId,
              candidateId: userId,
              gender,
              preference: preferenceGender,
              isOnline: true,
              isSearching: true,
              isInCall: false,
              regionMode: preferenceLocation,
              rejectionReason: 'Region mismatch',
            },
          );
          continue;
        }
      }

      console.log(
        'MATCH_CANDIDATE_FOUND',
        {
          currentUserId: currentUserId,
          candidateUserId: userId,
          currentGender: gender,
          currentPreference: preferenceGender,
          candidateGender,
          candidatePreference,
          regionMode: preferenceLocation,
        },
      );

      console.log(
        'MATCH_VALIDATED',
        {
          currentUserId: currentUserId,
          candidateId: userId,
          candidateGender,
        },
      );

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

    await this.clearQueuePreferences(
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

    console.log('QUEUE_REMOVED', {
      userId,
      gender,
    });
  }
}