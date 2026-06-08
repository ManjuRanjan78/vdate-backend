import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';

import {
  AccessToken,
} from 'livekit-server-sdk';

@Injectable()
export class LivekitService {

  // =========================
  // CREATE LIVEKIT TOKEN
  // =========================

  async createToken(
    userId: string,
    roomName: string,
    metadata?: any,
  ) {

    // =========================
    // ENV VARIABLES
    // =========================

    const apiKey =
      process.env.LIVEKIT_API_KEY;

    const apiSecret =
      process.env.LIVEKIT_API_SECRET;

    // =========================
    // VALIDATE ENV
    // =========================

    if (
      !apiKey ||
      !apiSecret
    ) {

      throw new InternalServerErrorException(
        'LiveKit API key and secret are required',
      );
    }

    // =========================
    // CLEAN INPUTS
    // =========================

    const cleanUserId =
      userId?.trim();

    const cleanRoomName =
      roomName?.trim();

    // =========================
    // VALIDATE USER
    // =========================

    if (
      !cleanUserId ||
      cleanUserId.length === 0
    ) {

      throw new BadRequestException(
        'LiveKit user identity is required',
      );
    }

    // =========================
    // VALIDATE ROOM
    // =========================

    if (
      !cleanRoomName ||
      cleanRoomName.length === 0
    ) {

      throw new BadRequestException(
        'LiveKit room name is required',
      );
    }

    // =========================
    // SAFE METADATA
    // =========================

    let safeMetadata:
      string | undefined;

    try {

      safeMetadata =
        metadata != null
          ? JSON.stringify(
              metadata,
            )
          : undefined;

    } catch (e) {

      console.log(
        'METADATA SERIALIZE ERROR:',
        e,
      );

      safeMetadata =
        undefined;
    }

    // =========================
    // CREATE ACCESS TOKEN
    // =========================
const identity =
  `${cleanUserId}-${Date.now()}`;
    const token =
  new AccessToken(
    apiKey,
    apiSecret,
    {
      identity,
      ttl: '2h',
      metadata: safeMetadata,
    },
  );

token.addGrant({

  roomCreate: true,

  roomJoin: true,

  room: cleanRoomName,

  canPublish: true,

  canSubscribe: true,

  canPublishData: true,

  canUpdateOwnMetadata: true,
});

const jwt =
  await token.toJwt();

console.log(
  'TOKEN GENERATED SUCCESSFULLY',
);

console.log(
  `IDENTITY: ${identity}`,
);

console.log(
  `JWT LENGTH: ${jwt.length}`,
);

return jwt;
  }
}