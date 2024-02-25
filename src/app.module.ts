import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DbClientModule } from './db-client/db-client.module';
import { EthersModule } from './ethers/ethers.module';
import { SchedulingModule } from './scheduling/scheduling.module';
import { LoggerModule } from './logger/logger.module';
import { RewardsTrackingModule } from './rewards-tracking/rewards-tracking.module';
import { LoggerMiddleware } from './middlewares/logger.middleware';

@Module({
  imports: [
    LoggerModule,
    EthersModule,
    DbClientModule,
    SchedulingModule,
    RewardsTrackingModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 20,
      },
    ]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
