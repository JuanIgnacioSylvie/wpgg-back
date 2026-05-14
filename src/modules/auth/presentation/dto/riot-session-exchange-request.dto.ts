import { IsNotEmpty, IsString } from 'class-validator';

export class RiotSessionExchangeRequestDto {
  @IsString()
  @IsNotEmpty()
  code: string;
}
