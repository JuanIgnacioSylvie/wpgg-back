import { plainToInstance } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';
import { parseAppMode } from './app-mode';
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
  POLYGON_RPC_URL: 'https://polygon-rpc.com',
  PRIVATE_KEY:
    '0xac0974bec39a17e36ba4a6b4d38bf08e81be68e78965973863080625f31f50a4',
  CONTRACT_ADDRESS: '0x1226A2972e5F8b5aEF7B7381cEA1AE8Ce3B2b188',
  APP_MODE: 'all',
  REDIS_URL: 'redis://localhost:6379',
  BULL_PREFIX: 'wpgg',
  MISSION_SYNC_INTERVAL_MS: 300_000,
  MISSION_EXPIRY_INTERVAL_MS: 3_600_000,
  MISSION_SYNC_QUEUE_CONCURRENCY: 3,
};

/** API-only vars; worker process ignores them (filled when missing in APP_MODE=worker). */
const WORKER_UNUSED_DEFAULTS: Record<string, unknown> = {
  JWT_SECRET: `worker-unused-${'0'.repeat(18)}`,
  JWT_ACCESS_EXPIRY: '15m',
  ALLOWED_ORIGINS: '*',
  POLYGON_RPC_URL: 'https://polygon-rpc.com',
  PRIVATE_KEY: `0x${'0'.repeat(64)}`,
  CONTRACT_ADDRESS: '0x1226A2972e5F8b5aEF7B7381cEA1AE8Ce3B2b188',
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

  /**
   * Mobile app deep link after successful RSO (`platform=mobile` in OAuth state).
   * Default when unset: `wpgg://auth/riot-callback`
   */
  @IsOptional()
  @IsString()
  RIOT_RSO_MOBILE_SUCCESS_REDIRECT_URL?: string;

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

  /** Inbox for sponsor proposals from the landing page. */
  @IsOptional()
  @IsEmail()
  SPONSOR_INBOX_EMAIL?: string;

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

  /** Cloudflare Turnstile secret for server-side captcha verification. */
  @IsOptional()
  @IsString()
  TURNSTILE_SECRET_KEY?: string;

  /** Cloudflare Turnstile site key (public), exposed to web clients when captcha is enabled. */
  @IsOptional()
  @IsString()
  TURNSTILE_SITE_KEY?: string;

  /** SPA route base for email verification links, e.g. `https://wpgg.lol/verify-email`. */
  @IsOptional()
  @IsString()
  EMAIL_VERIFICATION_URL?: string;

  /** Email verification token TTL in seconds (default 86400, min 300, max 86400). */
  @IsOptional()
  @IsInt()
  @Min(300)
  @Max(86400)
  EMAIL_VERIFICATION_TOKEN_TTL_SEC?: number;

  /** Polygon Mainnet JSON-RPC endpoint. */
  @IsString()
  @IsNotEmpty({ message: 'POLYGON_RPC_URL is required' })
  POLYGON_RPC_URL: string;

  /** Owner wallet private key for contract `rewardPlayer` calls. */
  @IsString()
  @IsNotEmpty({ message: 'PRIVATE_KEY is required' })
  @Matches(/^(0x)?[0-9a-fA-F]{64}$/, {
    message:
      'PRIVATE_KEY must be a 64-character hexadecimal string (optional 0x prefix). Check that Railway has the real wallet key, not a placeholder or masked value.',
  })
  PRIVATE_KEY: string;

  /** WPGG token contract address on Polygon Mainnet. */
  @IsString()
  @IsNotEmpty({ message: 'CONTRACT_ADDRESS is required' })
  CONTRACT_ADDRESS: string;

  /**
   * Process role: `api` (HTTP only), `worker` (background jobs), `all` (local dev).
   */
  @IsOptional()
  @IsString()
  @IsIn(['api', 'worker', 'all'])
  APP_MODE?: 'api' | 'worker' | 'all';

  /** Required when APP_MODE is `worker` or `all`. */
  @IsOptional()
  @IsString()
  REDIS_URL?: string;

  /** BullMQ key prefix in Redis (default: wpgg). */
  @IsOptional()
  @IsString()
  BULL_PREFIX?: string;

  /** Mission sync scheduler interval in ms (default: 300000 = 5 min). */
  @IsOptional()
  @IsInt()
  @Min(60_000)
  MISSION_SYNC_INTERVAL_MS?: number;

  /** Mission expiry scheduler interval in ms (default: 3600000 = 1 h). */
  @IsOptional()
  @IsInt()
  @Min(60_000)
  MISSION_EXPIRY_INTERVAL_MS?: number;

  /** Concurrent mission-sync jobs per worker process (default: 3). */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  MISSION_SYNC_QUEUE_CONCURRENCY?: number;
}

function applyWorkerUnusedDefaults(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const result = { ...config };
  for (const [key, value] of Object.entries(WORKER_UNUSED_DEFAULTS)) {
    const current = result[key];
    if (current === undefined || current === '') {
      result[key] = value;
    }
  }
  return result;
}

export function validate(config: Record<string, unknown>): EnvironmentVariables {
  const appModeEarly = parseAppMode(config['APP_MODE']);

  let merged: Record<string, unknown> = isRelaxEnv(config['RELAX_VALIDATIONS'])
    ? { ...RELAX_ENV_DEFAULTS, ...config }
    : { ...config };

  if (appModeEarly === 'worker' && !isRelaxEnv(config['RELAX_VALIDATIONS'])) {
    merged = applyWorkerUnusedDefaults(merged);
  }

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

  const appMode = parseAppMode(validatedConfig.APP_MODE ?? merged['APP_MODE']);
  validatedConfig.APP_MODE = appMode;

  if (
    (appMode === 'worker' || appMode === 'all') &&
    !validatedConfig.REDIS_URL?.trim()
  ) {
    throw new Error(
      'Environment validation failed: REDIS_URL is required when APP_MODE is worker or all',
    );
  }

  return validatedConfig;
}
