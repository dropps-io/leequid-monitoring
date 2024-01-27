import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {seedMonitoring} from "./db-client/seed";
import {DEPLOY_ENV, PORT} from "./globals";

async function bootstrap() {
  await seedMonitoring();
  const app = await NestFactory.create(AppModule);

  if (DEPLOY_ENV !== 'prod') {
    app.enableCors({origin: '*'});
  }

  await app.listen(PORT);
}
bootstrap();
