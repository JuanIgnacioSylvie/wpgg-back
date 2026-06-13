import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class SupportRequestRequestDto {
  @IsEmail()
  @MaxLength(254)
  contactEmail!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(200)
  subject!: string;

  @IsString()
  @MinLength(20)
  @MaxLength(4000)
  message!: string;

  /** Cloudflare Turnstile token (required for web when configured). */
  @IsOptional()
  @IsString()
  turnstileToken?: string;
}
