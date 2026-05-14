import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RefreshRequestDto {
  /** Use when the SPA cannot send the httpOnly refresh cookie (e.g. API on another domain). */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  refreshToken?: string;
}
