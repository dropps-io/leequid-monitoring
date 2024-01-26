import { Module } from '@nestjs/common';

import { DbClientService } from './db-client.service';
import {LoggerModule} from "../logger/logger.module";

@Module({
  imports: [LoggerModule],
  providers: [DbClientService],
  exports: [DbClientService],
})
export class DbClientModule {}
