import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || 'Najnar@420',
  database: process.env.DB_NAME || 'dating_app',
  synchronize: false,
  logging: false,
  entities: [__dirname + '/**/*.entity.ts'],
  migrations: [__dirname + '/migrations/*.ts'],
  subscribers: [],
});

export default AppDataSource;
