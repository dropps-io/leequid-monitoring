import { Module } from '@nestjs/common';

import { ValidatorsService } from './validators.service';
import { EthersModule } from '../ethers/ethers.module';
import { ClientApiModule } from '../client-api/client-api.module';
import { DbClientModule } from '../db-client/db-client.module';
import { LoggerModule } from '../logger/logger.module';
import { FetcherModule } from '../fetcher/fetcher.module';

@Module({
  imports: [LoggerModule, EthersModule, FetcherModule, DbClientModule, ClientApiModule],
  providers: [ValidatorsService],
  exports: [ValidatorsService],
})
export class ValidatorsModule {}
