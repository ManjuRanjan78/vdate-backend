import {
  Controller,
  Get,
} from '@nestjs/common';

import { RedisService }
from '../redis/redis.service';

@Controller('matches')
export class MatchesController {

  constructor(
    private readonly redisService: RedisService,
  ) {}

  @Get('queues')
  async getQueues() {

    const maleQueue =
      await this.redisService.smembers(
        'male_waiting',
      );

    const femaleQueue =
      await this.redisService.smembers(
        'female_waiting',
      );

    return {
      maleQueue,
      femaleQueue,
    };
  }
}