import {
  IsNotEmpty,
  IsString,
} from 'class-validator';

export class EndVideoCallDto {

  @IsString()
  @IsNotEmpty()
  callId!: string;
}