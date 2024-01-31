import { Injectable } from '@nestjs/common';
import winston from 'winston';
import { Cron } from '@nestjs/schedule';

import { RewardsTrackingService } from '../rewards-tracking/rewards-tracking.service';
import { MONITORING_CRON } from '../globals';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class SchedulingService {
  protected readonly logger: winston.Logger;

  constructor(
    protected readonly loggerService: LoggerService,
    protected readonly rewardsTrackingService: RewardsTrackingService,
  ) {
    // Initialize logger
    this.logger = loggerService.getChildLogger('SchedulingService');
  }

  @Cron(MONITORING_CRON)
  public async trackRewards(): Promise<void> {
    this.logger.info('Cron job running');
    await this.rewardsTrackingService.trackRewards();
  }
}
