import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RsoRefreshRequestDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;

  @IsOptional()
  @IsString()
  scope?: string;
}
