import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import type { INestApplication } from '@nestjs/common';
import { isRelaxFromConfig } from './config/relax-env';
import { HttpExceptionFilter } from './shared/presentation/filters/http-exception.filter';

export async function configureApp(
  app: INestApplication,
): Promise<ConfigService> {
  const configService = app.get(ConfigService);
  const relax = isRelaxFromConfig(configService);

  app.enableShutdownHooks();

  if (!relax) {
    app.use(helmet());
  }

  const allowedOriginsRaw = configService.get<string>('ALLOWED_ORIGINS', '');
  const allowedOrigins = allowedOriginsRaw
    ? allowedOriginsRaw
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean)
    : [];

  const corsAllowAny =
    relax || (allowedOrigins.length === 1 && allowedOrigins[0] === '*');

  app.enableCors({
    origin: corsAllowAny
      ? true
      : allowedOrigins.length > 0
        ? (origin, callback) => {
            if (!origin) {
              callback(null, true);
              return;
            }
            if (allowedOrigins.includes(origin)) {
              callback(null, true);
            } else {
              callback(null, false);
            }
          }
        : false,
    credentials: true,
  });

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe(
      relax
        ? {
            whitelist: false,
            forbidNonWhitelisted: false,
            transform: true,
          }
        : {
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
          },
    ),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  return configService;
}

export async function listen(app: INestApplication): Promise<void> {
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);
}
