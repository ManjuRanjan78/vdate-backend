import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

import {
  RedisClientType,
  createClient,
} from 'redis';

@Injectable()
export class RedisService
  implements OnModuleInit, OnModuleDestroy {

 private client!: RedisClientType;

  async onModuleInit() {

    this.client = createClient({
      url: 'redis://localhost:6379',
      socket: {
  reconnectStrategy: (retries) => {

    if (retries > 10) {
      return new Error(
        'Redis reconnect failed',
      );
    }

    return Math.min(
      retries * 100,
      3000,
    );
  },
},
    });

    // =========================
    // REDIS EVENTS
    // =========================

    this.client.on('connect', () => {
      console.log('🔄 Redis Connecting...');
    });

    this.client.on('ready', () => {
      console.log('✅ Redis Ready');
    });

    this.client.on('error', (err) => {
      console.log('❌ Redis Error:', err);
    });

    this.client.on('reconnecting', () => {
      console.log('♻️ Redis Reconnecting...');
    });

    await this.client.connect();

    console.log('✅ Redis Connected');
  }

 async onModuleDestroy() {

  try {

    if (
      this.client?.isOpen
    ) {

      await this.client.quit();
    }

  } catch (e) {

    console.log(
      'Redis quit error:',
      e,
    );
  }

  console.log(
    '🛑 Redis Disconnected',
  );
}

 // =========================
// BASIC OPERATIONS
// =========================

async set(
  key: string,
  value: any,
  ttlSeconds?: number,
) {

  const stringValue =
    value === undefined
      ? null
      : JSON.stringify(value);

  if (stringValue == null) {
    return;
  }

  if (ttlSeconds) {

    await this.client.set(
      key,
      stringValue,
      {
        EX: ttlSeconds,
      },
    );

    return;
  }

  await this.client.set(
    key,
    stringValue,
  );
}

async get(key: string) {

  try {

    const data =
      await this.client.get(key);

    if (!data) {
      return null;
    }

    try {

      return JSON.parse(data);

    } catch (_) {

      return data;
    }

  } catch (e) {

    console.log(
      `Redis GET error: ${key}`,
      e,
    );

    return null;
  }
}

async del(key: string) {

  await this.client.del(key);
}


async exists(
  key: string,
) {

  return await this.client.exists(
    key,
  );
}
// =========================
// SET OPERATIONS
// =========================

async sadd(
  key: string,
  value: string,
) {

  await this.client.sAdd(
    key,
    value,
  );
}

async srem(
  key: string,
  value: string,
) {

  await this.client.sRem(
    key,
    value,
  );
}

async smembers(
  key: string,
) {

  return await this.client.sMembers(
    key,
  );
}

// =========================
// ONLINE USERS
// =========================

async addOnlineUser(
  userId: string,
  gender?: string,
) {

  // GLOBAL ONLINE USERS
  await this.sadd(
    'online_users',
    userId,
  );

  // GENDER SETS
  if (gender) {

    const normalizedGender =
      gender.toLowerCase();

    await this.sadd(
      `online:${normalizedGender}`,
      userId,
    );
  }

  console.log(
    `✅ User Online: ${userId}`,
  );

  console.log(
    'REDIS ONLINE USERS:',
    await this.smembers(
      'online_users',
    ),
  );
}

async getOnlineUsers() {

  return await this.smembers(
    'online_users',
  );
}

async removeOnlineUser(
  userId: string,
) {

  // REMOVE GLOBAL
  await this.srem(
    'online_users',
    userId,
  );

  // REMOVE GENDER SETS
  await this.srem(
    'online:male',
    userId,
  );

  await this.srem(
    'online:female',
    userId,
  );

  console.log(
    ` User Offline: ${userId}`,
  );

  // =========================
  // REMOVE SOCKET ONLY
  // =========================

  await this.del(
    `socket:${userId}`,
  );

  // DO NOT:
  // - remove queue here
  // - clear matching here
  // - clear busy here
  //
  // reconnects may happen
}

// =========================
// BUSY USERS
// =========================

async setBusy(
  userId: string,
) {

  await this.set(
    `busy:${userId}`,
    true,
    120,
  );
}

async removeBusy(
  userId: string,
) {

  await this.del(
    `busy:${userId}`,
  );
}

async isBusy(
  userId: string,
) {

  return await this.get(
    `busy:${userId}`,
  );
}

// =========================
// MATCHED USERS
// =========================

async setMatched(
  userId: string,
  peerId: string,
) {

  await this.set(
    `matched:${userId}`,
    peerId,
    120,
  );
}

async getMatched(
  userId: string,
) {

  return await this.get(
    `matched:${userId}`,
  );
}

async clearMatched(
  userId: string,
) {

  const peerId =
    await this.getMatched(
      userId,
    );

  await this.del(
    `matched:${userId}`,
  );

  if (peerId) {

    await this.del(
      `matched:${peerId}`,
    );
  }
}

// =========================
// MATCHMAKING
// =========================

async getNextAvailableUser(
  currentUserId: string,
) {

  const users =
    await this.getOnlineUsers();

  for (const userId of users) {

    // SKIP SELF
    if (
      userId === currentUserId
    ) {
      continue;
    }

    // SKIP BUSY
    const busy =
      await this.isBusy(
        userId,
      );

    if (busy) {
      continue;
    }

    // SKIP MATCHED
    const matched =
      await this.getMatched(
        userId,
      );

    if (matched) {
      continue;
    }

    // CHECK SOCKET
    const socketId =
      await this.get(
        `socket:${userId}`,
      );

    if (!socketId) {

      // CLEAN STALE USER
    await this.srem(
  'online_users',
  userId,
);

await this.srem(
  'online:male',
  userId,
);

await this.srem(
  'online:female',
  userId,
);

await this.del(
  `socket:${userId}`,
);

      continue;
    }

    return userId;
  }

  return null;
}

// =========================
// CLEAR MATCH PAIR
// =========================

async clearMatchPair(
  userId1: string,
  userId2: string,
) {

  await this.clearMatched(
    userId1,
  );

  await this.removeBusy(
    userId1,
  );

  await this.removeBusy(
    userId2,
  );
}

// =========================
// MATCH HISTORY
// =========================

async addMatchHistory(
  userId1: string,
  userId2: string,
) {
  // Store match history for 30 minutes (1800 seconds)
  const ttl = 1800;
  await this.set(`history:${userId1}:${userId2}`, 'true', ttl);
  await this.set(`history:${userId2}:${userId1}`, 'true', ttl);
}

async hasMatchHistory(
  userId1: string,
  userId2: string,
) {
  const result = await this.get(`history:${userId1}:${userId2}`);
  return !!result;
}
}