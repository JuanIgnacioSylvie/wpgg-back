import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class SponsorProposalRequestDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  companyName!: string;

  @IsEmail()
  @MaxLength(254)
  contactEmail!: string;

  @IsString()
  @MinLength(20)
  @MaxLength(4000)
  message!: string;

  /** Cloudflare Turnstile token (required for web when configured). */
  @IsOptional()
  @IsString()
  turnstileToken?: string;
}
