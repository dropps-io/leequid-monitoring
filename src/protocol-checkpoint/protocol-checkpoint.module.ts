import { Module } from '@nestjs/common';

import { ProtocolCheckpointService } from './protocol-checkpoint.service';
import { LoggerModule } from '../logger/logger.module';
import { EthersModule } from '../ethers/ethers.module';
import { DbClientModule } from '../db-client/db-client.module';

@Module({
  imports: [LoggerModule, EthersModule, DbClientModule],
  providers: [ProtocolCheckpointService],
  exports: [ProtocolCheckpointService],
})
export class ProtocolCheckpointModule {}
