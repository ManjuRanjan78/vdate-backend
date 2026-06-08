const { Client } = require('pg');

(async () => {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'Najnar@420',
    database: 'dating_app',
  });

  try {
    await client.connect();
    await client.query('BEGIN');

    console.log('Creating temporary users table with serial id...');
    await client.query(`
      CREATE TABLE users_new (
        "id" integer GENERATED ALWAYS AS IDENTITY (START WITH 35) PRIMARY KEY,
        "phone" varchar UNIQUE,
        "email" varchar UNIQUE,
        "googleId" varchar,
        "facebookId" varchar,
        "name" varchar,
        "gender" varchar,
        "dob" date,
        "profileCompleted" boolean NOT NULL DEFAULT false,
        "interests" json,
        "bio" text,
        "age" integer,
        "isOnline" boolean NOT NULL DEFAULT false,
        "isLive" boolean NOT NULL DEFAULT false,
        "coins" integer NOT NULL DEFAULT 0,
        "followersCount" integer NOT NULL DEFAULT 0,
        "followingCount" integer NOT NULL DEFAULT 0,
        "likesCount" integer NOT NULL DEFAULT 0,
        "viewerCount" integer NOT NULL DEFAULT 0,
        "role" users_role_enum NOT NULL DEFAULT 'user',
        "hostApproved" boolean NOT NULL DEFAULT false,
        "agencyId" varchar,
        "isVerified" boolean NOT NULL DEFAULT false,
        "lastActiveAt" timestamp,
        "imageUrl" varchar,
        "country" varchar,
        "city" varchar,
        "location" varchar,
        "createdAt" timestamp NOT NULL DEFAULT now()
      );
    `);

    console.log('Copying users data into temporary table...');
    await client.query(`
      INSERT INTO users_new (
        "phone",
        "email",
        "googleId",
        "facebookId",
        "name",
        "gender",
        "dob",
        "profileCompleted",
        "interests",
        "bio",
        "age",
        "isOnline",
        "isLive",
        "coins",
        "followersCount",
        "followingCount",
        "likesCount",
        "viewerCount",
        "role",
        "hostApproved",
        "agencyId",
        "isVerified",
        "lastActiveAt",
        "imageUrl",
        "country",
        "city",
        "location",
        "createdAt"
      )
      SELECT
        "phone",
        "email",
        "googleId",
        "facebookId",
        "name",
        "gender",
        "dob",
        "profileCompleted",
        "interests",
        "bio",
        "age",
        "isOnline",
        "isLive",
        "coins",
        "followersCount",
        "followingCount",
        "likesCount",
        "viewerCount",
        "role",
        "hostApproved",
        "agencyId",
        "isVerified",
        "lastActiveAt",
        "imageUrl",
        "country",
        "city",
        "location",
        "createdAt"
      FROM users;
    `);

    console.log('Dropping stale refresh tokens...');
    await client.query('TRUNCATE TABLE refresh_tokens');

    console.log('Altering refresh_tokens.userId to integer...');
    await client.query('ALTER TABLE refresh_tokens ALTER COLUMN "userId" DROP NOT NULL');
    await client.query('ALTER TABLE refresh_tokens ALTER COLUMN "userId" TYPE integer USING NULL');
    await client.query('ALTER TABLE refresh_tokens ALTER COLUMN "userId" SET NOT NULL');

    console.log('Replacing old users table...');
    await client.query('DROP TABLE users');
    await client.query('ALTER TABLE users_new RENAME TO users');

    await client.query('COMMIT');
    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
    await client.query('ROLLBACK');
    process.exit(1);
  } finally {
    await client.end();
  }
})();
