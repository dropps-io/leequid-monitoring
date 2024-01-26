import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {seedMonitoring} from "./db-client/seed";
import {PORT} from "./globals";

async function bootstrap() {
  await seedMonitoring();
  const app = await NestFactory.create(AppModule);
  await app.listen(PORT);
}
bootstrap();
