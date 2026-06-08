import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';

export class CreateCallHistoryDto {
  @IsNotEmpty()
  @IsString()
  callId!: string;

  @IsNotEmpty()
  @IsNumber()
  callerId!: number;

  @IsNotEmpty()
  @IsNumber()
  receiverId!: number;

  @IsOptional()
  @IsString()
  roomName?: string;

  @IsOptional()
  @IsString()
  callType?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
