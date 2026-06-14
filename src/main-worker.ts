import { NestFactory } from '@nestjs/core';
import { AppWorkerModule } from './app-worker.module';
import { configureApp, listen } from './bootstrap';
import { resolveNestLoggerLevels } from './config/nest-logger';

// Entry point defines process mode (Railway worker service may omit APP_MODE).
process.env.APP_MODE = 'worker';

async function bootstrap() {
  const app = await NestFactory.create(AppWorkerModule, {
    logger: resolveNestLoggerLevels(),
  });
  await configureApp(app);
  await listen(app);
}
bootstrap();
