import { NestFactory } from '@nestjs/core';
import { AppApiModule } from './app-api.module';
import { configureApp, listen } from './bootstrap';
import { resolveNestLoggerLevels } from './config/nest-logger';

process.env.APP_MODE = 'api';

async function bootstrap() {
  const app = await NestFactory.create(AppApiModule, {
    logger: resolveNestLoggerLevels(),
  });
  await configureApp(app);
  await listen(app);
}
bootstrap();
