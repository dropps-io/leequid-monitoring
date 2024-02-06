import { Module } from '@nestjs/common';

import { ClientApiService } from './client-api.service';
import { LoggerModule } from '../logger/logger.module';

@Module({
  imports: [LoggerModule],
  exports: [ClientApiService],
  providers: [ClientApiService],
})
export class ClientApiModule {}
