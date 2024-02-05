import { Injectable } from '@nestjs/common';
import winston from 'winston';
import { Cron } from '@nestjs/schedule';

import { RewardsTrackingService } from '../rewards-tracking/rewards-tracking.service';
import { CRON_PROTOCOL_CHECKPOINT, MONITORING_CRON } from '../globals';
import { LoggerService } from '../logger/logger.service';
import { ProtocolCheckpointService } from '../protocol-checkpoint/protocol-checkpoint.service';

@Injectable()
export class SchedulingService {
  protected readonly logger: winston.Logger;

  constructor(
    protected readonly loggerService: LoggerService,
    protected readonly rewardsTrackingService: RewardsTrackingService,
    protected readonly protocolCheckpointService: ProtocolCheckpointService,
  ) {
    // Initialize logger
    this.logger = loggerService.getChildLogger('SchedulingService');
  }

  @Cron(MONITORING_CRON)
  public async trackRewards(): Promise<void> {
    this.logger.info('Cron job running');
    await this.rewardsTrackingService.trackRewards();
  }

  @Cron(CRON_PROTOCOL_CHECKPOINT)
  public async createProtocolCheckpoint(): Promise<void> {
    this.logger.info('Protocol checkpoint cron job running');
    await this.protocolCheckpointService.createProtocolCheckpoint();
  }
}
