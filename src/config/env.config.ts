import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
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
  JWT_REFRESH_EXPIRY: '7d',
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
  @IsNotEmpty({ message: 'JWT_REFRESH_EXPIRY is required' })
  JWT_REFRESH_EXPIRY: string;

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
