import { IsNotEmpty, IsString } from 'class-validator';

export class RsoUserinfoRequestDto {
  @IsString()
  @IsNotEmpty()
  accessToken: string;
}
