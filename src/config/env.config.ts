import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';
import { isRelaxEnv } from './relax-env';

enum NodeEnvironment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

const RELAX_ENV_DEFAULTS: Record<string, unknown> = {
  DATABASE_URL: 'postgresql://localhost:5432/wpgg?schema=public',
  JWT_SECRET: '0'.repeat(32),
  JWT_ACCESS_EXPIRY: '15m',
  RIOT_API_KEY: 'RGAPI-dev-placeholder-replace-in-env',
  PORT: 3000,
  NODE_ENV: NodeEnvironment.Development,
  ALLOWED_ORIGINS: '*',
};

class EnvironmentVariables {
  @IsOptional()
  @IsString()
  RELAX_VALIDATIONS?: string;

  @IsOptional()
  @IsString()
  DEV_BYPASS_USER_ID?: string;

  @IsString()
  @IsNotEmpty({ message: 'DATABASE_URL is required' })
  DATABASE_URL: string;

  @IsString()
  @IsNotEmpty({ message: 'JWT_SECRET is required' })
  @MinLength(32, {
    message: 'JWT_SECRET must be at least 32 characters long',
  })
  JWT_SECRET: string;

  @IsString()
  @IsNotEmpty({ message: 'JWT_ACCESS_EXPIRY is required' })
  JWT_ACCESS_EXPIRY: string;

  @IsString()
  @IsNotEmpty({ message: 'RIOT_API_KEY is required' })
  RIOT_API_KEY: string;

  @IsInt({ message: 'PORT must be an integer' })
  PORT: number;

  @IsEnum(NodeEnvironment, {
    message: `NODE_ENV must be one of: ${Object.values(NodeEnvironment).join(', ')}`,
  })
  NODE_ENV: NodeEnvironment;

  @IsString()
  @IsNotEmpty({ message: 'ALLOWED_ORIGINS is required' })
  ALLOWED_ORIGINS: string;

  /**
   * Session cookies (`accessToken`, `refreshToken`): SameSite policy.
   * Default: `none` in production (cross-site SPA + API), `lax` otherwise.
   * `none` always implies `Secure: true` (browser requirement).
   */
  @IsOptional()
  @IsString()
  @IsIn(['none', 'lax', 'strict'])
  SESSION_COOKIE_SAME_SITE?: 'none' | 'lax' | 'strict';

  /**
   * Override Secure flag on session cookies (`true` | `false`).
   * Ignored when SameSite is `none` (Secure stays true).
   */
  @IsOptional()
  @IsString()
  @IsIn(['true', 'false'])
  SESSION_COOKIE_SECURE?: string;

  /**
   * Lifetime in seconds for `riot_session` one-time codes (default 600, min 60, max 86400).
   */
  @IsOptional()
  @IsInt()
  @Min(60)
  @Max(86400)
  RIOT_SESSION_CODE_TTL_SEC?: number;

  /** Riot Sign On — optional; required only for `riot/rso/*` routes */
  @IsOptional()
  @IsString()
  RIOT_RSO_CLIENT_ID?: string;

  @IsOptional()
  @IsString()
  RIOT_RSO_CLIENT_SECRET?: string;

  /** Private-key JWT client assertion (alternative to RIOT_RSO_CLIENT_SECRET) */
  @IsOptional()
  @IsString()
  RIOT_RSO_CLIENT_ASSERTION?: string;

  @IsOptional()
  @IsString()
  RIOT_RSO_REDIRECT_URI?: string;

  /**
   * After a successful `/riot/rso/oauth2-callback`, redirect (302) here instead of
   * returning JSON. Appends `?riot_session=<one-time code>` and then sets wpgg session
   * cookies on the API host. If the one-time code cannot be stored, redirects with
   * `?error=riot_session_unavailable` (no cookies). SPA: `POST /auth/riot-session` with the code.
   * On OAuth error, `?error=` / `?error_description=`; missing Riot subject: `?error=rso_no_subject`.
   */
  @IsOptional()
  @IsString()
  RIOT_RSO_SUCCESS_REDIRECT_URL?: string;

  /** Space-separated scopes (default: openid offline_access cpid) */
  @IsOptional()
  @IsString()
  RIOT_RSO_SCOPES?: string;

  /**
   * Platform region (e.g. LA2) used when RSO userinfo omits cpid during auto-link.
   * Must be one of [ALLOWED_RIOT_REGIONS].
   */
  @IsOptional()
  @IsString()
  RIOT_DEFAULT_LINK_REGION?: string;

  /** Resend API key for transactional email (password reset). */
  @IsOptional()
  @IsString()
  RESEND_API_KEY?: string;

  /** Sender address, e.g. `WPGG <noreply@wpgg.lol>`. */
  @IsOptional()
  @IsString()
  EMAIL_FROM?: string;

  /** SPA route base for reset links, e.g. `https://wpgg.lol/reset-password`. */
  @IsOptional()
  @IsString()
  PASSWORD_RESET_URL?: string;

  /** Password reset token TTL in seconds (default 3600, min 300, max 86400). */
  @IsOptional()
  @IsInt()
  @Min(300)
  @Max(86400)
  PASSWORD_RESET_TOKEN_TTL_SEC?: number;
}

export function validate(config: Record<string, unknown>): EnvironmentVariables {
  const merged: Record<string, unknown> = isRelaxEnv(config['RELAX_VALIDATIONS'])
    ? { ...RELAX_ENV_DEFAULTS, ...config }
    : { ...config };

  const portRaw = merged['PORT'];
  const portResolved =
    portRaw === undefined || portRaw === '' || portRaw === null
      ? isRelaxEnv(merged['RELAX_VALIDATIONS'])
        ? Number(RELAX_ENV_DEFAULTS['PORT'])
        : undefined
      : Number(portRaw);

  const rawConfig = {
    ...merged,
    PORT: portResolved,
  };

  const validatedConfig = plainToInstance(EnvironmentVariables, rawConfig, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const messages = errors
      .map((error) => Object.values(error.constraints ?? {}).join(', '))
      .join('; ');
    throw new Error(`Environment validation failed: ${messages}`);
  }

  return validatedConfig;
}
