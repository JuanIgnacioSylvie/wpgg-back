import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterRequestDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  /** One-time code from `?riot_link_pending=` after RSO login without WPGG account. */
  @IsOptional()
  @IsString()
  @MaxLength(256)
  riotLinkPendingCode?: string;
}
