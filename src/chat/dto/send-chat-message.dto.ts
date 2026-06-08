import { IsNotEmpty, IsString } from 'class-validator';

export class SendChatMessageDto {
  @IsNotEmpty()
  @IsString()
  receiverId!: string;

  @IsNotEmpty()
  @IsString()
  messageKey!: string;
}
