import { Module } from '@nestjs/common';

import { EthersService } from './ethers.service';
import { LoggerModule } from '../logger/logger.module';

@Module({
  imports: [LoggerModule],
  providers: [EthersService],
  exports: [EthersService],
})
export class EthersModule {}
