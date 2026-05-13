import { IsOptional, IsString } from 'class-validator';

export class RsoCallbackQueryDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  error?: string;

  @IsOptional()
  @IsString()
  error_description?: string;

  /** OIDC: issuer; Riot includes this on the authorization redirect. */
  @IsOptional()
  @IsString()
  iss?: string;
}
