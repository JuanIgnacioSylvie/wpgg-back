import { NestFactory } from '@nestjs/core';
import { AppWorkerModule } from './app-worker.module';
import { configureApp, listen } from './bootstrap';

async function bootstrap() {
  const app = await NestFactory.create(AppWorkerModule);
  await configureApp(app);
  await listen(app);
}
bootstrap();
