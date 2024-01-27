import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { seedMonitoring } from './db-client/seed';
import { DEPLOY_ENV, PORT } from './globals';

async function bootstrap(): Promise<void> {
  await seedMonitoring();

  const app = await NestFactory.create(AppModule);

  if (DEPLOY_ENV !== 'prod') {
    app.enableCors({
      origin: ['http://localhost:3000', 'http://localhost:3001', 'https://staging.app.leequid.io'],
      methods: 'GET',
    });
  } else {
    app.enableCors({
      origin: ['https://app.leequid.io'],
      methods: 'GET',
    });
  }

  await app.listen(PORT);
}
bootstrap();
