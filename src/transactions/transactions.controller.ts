import {
  Controller,
  Get,
  Param,
} from '@nestjs/common';

import { TransactionsService } from './transactions.service';

@Controller('transactions')
export class TransactionsController {

  constructor(
    private readonly transactionsService:
      TransactionsService,
  ) {}

  @Get(':userId')
  async getTransactions(
    @Param('userId') userId: string,
  ) {

    return this.transactionsService
        .getTransactions(userId);
  }
}