import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { seedMonitoring } from './db-client/seed';
import { PORT } from './globals';

async function bootstrap(): Promise<void> {
  await seedMonitoring();

  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://leequid.io',
      'https://app.leequid.io',
      'https://staging.leequid.io',
      'https://staging.app.leequid.io',
    ],
    methods: ['GET'],
    credentials: true,
  });
  await app.listen(PORT);
}
bootstrap();
