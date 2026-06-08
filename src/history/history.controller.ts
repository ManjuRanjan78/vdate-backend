import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';

@Controller('history')
export class HistoryController {
  @Get(':userId')
  async getHistory(@Param('userId') userId: string) {
    // Mock data for now
    return { data: [] };
  }
}