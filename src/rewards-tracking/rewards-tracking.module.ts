import { Module } from '@nestjs/common';

import { RewardsTrackingService } from './rewards-tracking.service';
import { EthersModule } from '../ethers/ethers.module';
import { DbClientModule } from '../db-client/db-client.module';
import {FetcherModule} from "../fetcher/fetcher.module";
import {LoggerModule} from "../logger/logger.module";

@Module({
  imports: [LoggerModule, EthersModule, DbClientModule, FetcherModule],
  providers: [RewardsTrackingService],
  exports: [RewardsTrackingService],
})
export class RewardsTrackingModule {}
