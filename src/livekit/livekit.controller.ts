import {
  BadRequestException,
  Controller,
  Get,
  InternalServerErrorException,
  Query,
} from '@nestjs/common';

import { LivekitService }
from './livekit.service';

@Controller('livekit')
export class LivekitController {

  constructor(
    private readonly livekitService:
      LivekitService,
  ) {}

  // =========================
  // GENERATE LIVEKIT TOKEN
  // =========================

  @Get('token')
  async generateToken(

    @Query('roomName')
    roomName: string,

    @Query('identity')
    identity: string,

    @Query('userId')
    userId: string,

    @Query('name')
    name?: string,

    @Query('image')
    image?: string,

    @Query('gender')
    gender?: string,
  ) {

    try {

      // =========================
      // VALIDATE ROOM
      // =========================

      if (
        !roomName ||
        roomName.trim().length === 0
      ) {

        throw new BadRequestException(
          'roomName query parameter is required',
        );
      }

      // =========================
      // VALIDATE USER
      // =========================

      const participantId =
        (
          identity ||
          userId
        )?.trim();

      if (
        !participantId
      ) {

        throw new BadRequestException(
          'identity or userId query parameter is required',
        );
      }

      // =========================
      // USER METADATA
      // =========================

      const metadata = {

        name:
          name ?? '',

        image:
          image ?? '',

        gender:
          gender ?? '',
      };

      // =========================
      // DEBUG LOGS
      // =========================

      console.log(
        '=========================',
      );

      console.log(
        'LIVEKIT TOKEN REQUEST',
      );

      console.log({

        roomName,

        participantId,

        metadata,
      });

      console.log(
        '=========================',
      );

      // =========================
      // GENERATE TOKEN
      // =========================

      const token =
        await this.livekitService
          .createToken(

            participantId,

            roomName,

            metadata,
          );

      // =========================
      // VALIDATE TOKEN
      // =========================

      if (!token) {

        throw new InternalServerErrorException(
          'Failed to generate LiveKit token',
        );
      }

      // =========================
      // RESPONSE
      // =========================

      return {

        success: true,

        token,

        url:
          process.env
              .LIVEKIT_URL ??
          '',

        roomName,

        identity:
          participantId,

        metadata,
      };

    } catch (e) {

      console.log(
        'LIVEKIT TOKEN ERROR:',
        e,
      );

      throw e;
    }
  }
}