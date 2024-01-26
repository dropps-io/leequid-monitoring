import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { SchedulingService } from './scheduling.service';
import { RewardsTrackingModule } from '../rewards-tracking/rewards-tracking.module';
import {LoggerModule} from "../logger/logger.module";

@Module({
  imports: [LoggerModule, ScheduleModule.forRoot(), RewardsTrackingModule],
  providers: [SchedulingService],
  exports: [SchedulingService],
})
export class SchedulingModule {}
