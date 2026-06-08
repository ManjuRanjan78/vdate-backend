import {
  Controller,
  Post,
  Body,
  Req,
} from '@nestjs/common';

import { CallsService }
from './calls.service';

import { StartVideoCallDto }
from './dto/start-video-call.dto';

import { EndVideoCallDto }
from './dto/end-video-call.dto';

@Controller('calls')
export class CallsController {

  constructor(
    private readonly callsService:
      CallsService,
  ) {}

  // =========================
  // START VIDEO CALL
  // =========================

  @Post('video/start')
  async startVideoCall(

    @Body()
    body: StartVideoCallDto,
    @Req() req: any,

  ) {
    const currentUserId =
      body.currentUserId || req.user?.userId;

    if (!currentUserId) {
      throw new Error(
        'Current user ID is required',
      );
    }

    return this.callsService.startVideoCall(
      currentUserId,
      body.receiverId,
    );
  }

  // =========================
  // END VIDEO CALL
  // =========================

  @Post('video/end')
  async endVideoCall(

    @Body()
    body: EndVideoCallDto,

  ) {

    return this.callsService
      .endVideoCall(
        body.callId,
      );
  }
}