import { Injectable } from '@nestjs/common';

@Injectable()
export class TransactionsService {

  async getTransactions(
    userId: string,
  ) {

    // TODO:
    // Replace with DB query

    return {
      success: true,

      userId,

      transactions: [

        {
          id: 1,
          type: 'coin_purchase',
          amount: 100,
          status: 'success',
          createdAt: new Date(),
        },

        {
          id: 2,
          type: 'video_call',
          amount: -20,
          status: 'success',
          createdAt: new Date(),
        },

        {
          id: 3,
          type: 'gift_sent',
          amount: -50,
          status: 'success',
          createdAt: new Date(),
        },
      ],
    };
  }
}