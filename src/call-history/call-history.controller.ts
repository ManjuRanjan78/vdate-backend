import { Controller, Get, Post, Body, Query, Param, Patch } from '@nestjs/common';
import { CallHistoryService } from './call-history.service';

@Controller('call-history')
export class CallHistoryController {
  constructor(private readonly callHistoryService: CallHistoryService) {}

  @Post()
  create(@Body() createData: any) {
    return this.callHistoryService.createCallRecord(createData);
  }

  @Get()
  findByUser(@Query('userId') userId: string) {
    return this.callHistoryService.getUserCallHistory(userId);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.callHistoryService.getCallRecordById(id);
  }

  @Patch(':id/end')
  endCall(
    @Param('id') id: string,
    @Body('duration') duration: number,
    @Body('status') status: string
  ) {
    return this.callHistoryService.endCallRecord(id, duration, status);
  }
}
