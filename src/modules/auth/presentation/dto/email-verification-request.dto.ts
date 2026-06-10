import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class VerifyEmailRequestDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(512)
  token: string;
}

export class ResendEmailVerificationRequestDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(4096)
  turnstileToken?: string;
}
