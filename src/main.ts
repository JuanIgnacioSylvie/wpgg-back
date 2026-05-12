import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { isRelaxFromConfig } from './config/relax-env';
import { HttpExceptionFilter } from './shared/presentation/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const relax = isRelaxFromConfig(configService);

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
    relax ||
    (allowedOrigins.length === 1 && allowedOrigins[0] === '*');

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

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);
}
bootstrap();
