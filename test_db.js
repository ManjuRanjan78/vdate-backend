const { Client } = require('pg');

async function test() {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'dating_app',
    password: 'Najnar@420',
    port: 5432,
  });

  await client.connect();
  const res = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'friend_requests';
  `);
  console.log(res.rows);
  await client.end();
}

test();
