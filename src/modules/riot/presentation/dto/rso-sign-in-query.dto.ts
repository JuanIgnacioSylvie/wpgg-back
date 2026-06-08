import { IsIn, IsOptional, IsString } from 'class-validator';

export class RsoSignInQueryDto {
  @IsOptional()
  @IsString()
  loginHint?: string;

  @IsOptional()
  @IsString()
  uiLocales?: string;

  /** When `true` or `1`, respond with HTTP 302 to Riot authorize URL. */
  @IsOptional()
  @IsIn(['true', 'false', '0', '1'])
  redirect?: string;

  /** `mobile` — success redirect uses `RIOT_RSO_MOBILE_SUCCESS_REDIRECT_URL` (deep link). */
  @IsOptional()
  @IsIn(['mobile'])
  platform?: string;
}
