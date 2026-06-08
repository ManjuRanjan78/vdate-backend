import { NestFactory } from '@nestjs/core';

import { ValidationPipe }
from '@nestjs/common';

import { AppModule }
from './app.module';

import * as dotenv
from 'dotenv';

dotenv.config();

async function bootstrap() {

  const app =
    await NestFactory.create(
      AppModule,
    );

  // =========================
  // GLOBAL PREFIX
  // =========================

  app.setGlobalPrefix('api');

  // =========================
  // GLOBAL VALIDATION
  // =========================

  app.useGlobalPipes(
    new ValidationPipe({

      whitelist: true,

      forbidNonWhitelisted: true,

      transform: true,
    }),
  );

  // =========================
  // CORS
  // =========================

  app.enableCors({
  origin: '*',
  credentials: true,
});

  // =========================
  // START SERVER
  // =========================

  const port =
    process.env.PORT || 3000;

  await app.listen(
    port,
    '0.0.0.0',
  );

  console.log(
    `🚀 Server running on port ${port}`,
  );
}

void bootstrap();