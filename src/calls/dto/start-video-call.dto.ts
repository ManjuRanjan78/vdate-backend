import {
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class StartVideoCallDto {

  @IsString()
  @IsOptional()
  currentUserId?: string;

  @IsString()
  @IsNotEmpty()
  receiverId!: string;
}