import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './shared/presentation/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  // Security headers via Helmet (Requirement 14.3)
  app.use(helmet());

  // CORS configuration (Requirements 14.4, 14.6)
  const allowedOriginsRaw = configService.get<string>('ALLOWED_ORIGINS', '');
  const allowedOrigins = allowedOriginsRaw
    ? allowedOriginsRaw
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean)
    : [];

  app.enableCors({
    origin:
      allowedOrigins.length > 0
        ? (origin, callback) => {
            // Allow requests with no origin (e.g. server-to-server, curl)
            if (!origin) {
              callback(null, true);
              return;
            }
            if (allowedOrigins.includes(origin)) {
              callback(null, true);
            } else {
              callback(new Error('Not allowed by CORS'));
            }
          }
        : false, // Reject all cross-origin requests when ALLOWED_ORIGINS is absent or empty
    credentials: true,
  });

  // Cookie parser middleware (Requirement 14.1)
  app.use(cookieParser());

  // Global ValidationPipe (Requirements 14.2)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global HttpExceptionFilter (Requirement 13.1, 13.5)
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);
}
bootstrap();
