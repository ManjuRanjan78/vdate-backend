import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatRoom } from './entities/chat-room.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { User } from '../users/users.entity';
import { MessageTemplate } from './entities/message-template.entity';
import { Friend } from '../friends/entities/friend.entity';
import { Friendship } from '../friends/entities/friendship.entity';
import { FriendsModule } from '../friends/friends.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, MessageTemplate, Friend, Friendship, ChatRoom, ChatMessage]),
    forwardRef(() => FriendsModule),
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway],
  exports: [ChatService],
})
export class ChatModule {}