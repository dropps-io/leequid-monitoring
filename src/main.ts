import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { seedMonitoring } from './db-client/seed';
import { PORT } from './globals';

async function bootstrap(): Promise<void> {
  await seedMonitoring();

  const app = await NestFactory.create(AppModule);

  app.enableCors();
  await app.listen(PORT);
}
bootstrap();
