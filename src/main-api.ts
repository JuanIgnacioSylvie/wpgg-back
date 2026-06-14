import { NestFactory } from '@nestjs/core';
import { AppApiModule } from './app-api.module';
import { configureApp, listen } from './bootstrap';

process.env.APP_MODE = 'api';

async function bootstrap() {
  const app = await NestFactory.create(AppApiModule);
  await configureApp(app);
  await listen(app);
}
bootstrap();
