import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  MinLength,
  validateSync,
} from 'class-validator';

enum NodeEnvironment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
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
  // Coerce PORT to a number before validation
  const rawConfig = {
    ...config,
    PORT: config['PORT'] !== undefined ? Number(config['PORT']) : undefined,
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
