import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { CallHistoryService } from './call-history.service';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class CallHistoryGateway {
  constructor(private readonly callHistoryService: CallHistoryService) {}

  @SubscribeMessage('call_started')
  async handleCallStarted(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { callerId: string; receiverId: string; roomName?: string; callType?: string },
  ) {
    try {
      const record = await this.callHistoryService.createCallRecord({
        callerId: data.callerId,
        receiverId: data.receiverId,
        roomName: data.roomName,
        callType: data.callType || 'VIDEO',
        status: 'STARTED',
        startedAt: new Date(),
      });
      client.emit('call_history_created', { id: record.id });
      return record;
    } catch (error) {
      console.error('Call started error:', error);
    }
  }

  @SubscribeMessage('call_ended')
  async handleCallEnded(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { id: string; duration: number },
  ) {
    try {
      await this.callHistoryService.endCallRecord(data.id, data.duration, 'COMPLETED');
    } catch (error) {
      console.error('Call ended error:', error);
    }
  }

  @SubscribeMessage('call_rejected')
  async handleCallRejected(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { id: string },
  ) {
    try {
      await this.callHistoryService.endCallRecord(data.id, 0, 'REJECTED');
    } catch (error) {
      console.error('Call rejected error:', error);
    }
  }

  @SubscribeMessage('call_missed')
  async handleCallMissed(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { id: string },
  ) {
    try {
      await this.callHistoryService.endCallRecord(data.id, 0, 'MISSED');
    } catch (error) {
      console.error('Call missed error:', error);
    }
  }
}
