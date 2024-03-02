import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import winston from 'winston';
import { Response } from 'express';
import { ThrottlerGuard } from '@nestjs/throttler';

import { LoggerService } from './logger/logger.service';
import { AppService } from './app.service';
import { throwHTTPError } from './utils/throw-http-error';
import { SUPPORTED_CURRENCY } from './rewards-tracking/types';

@Controller()
@UseGuards(ThrottlerGuard)
export class AppController {
  protected logger: winston.Logger;
  constructor(protected loggerService: LoggerService, protected monitoringService: AppService) {
    this.logger = loggerService.getChildLogger('MonitoringController');
  }
  @Get('/healthz') healthz(): string {
    return 'ok';
  }

  @Get('/state') async state(): Promise<{
    stakers: number;
    totalStaked: number;
    APR: number;
    APY: number;
  }> {
    try {
      return await this.monitoringService.fetchProtocolState();
    } catch (error) {
      this.logger.error(`Error while getting protocol state: ${error.message}`, {
        stack: error.stack,
      });
      throwHTTPError('Internal Error', 500);
    }
  }

  @Get('/operators') async operators(): Promise<
    {
      address: string;
      activatedValidators: number;
      exitedValidators: number;
      pendingValidators: number;
    }[]
  > {
    try {
      return await this.monitoringService.fetchOperatorsState();
    } catch (error) {
      this.logger.error(`Error while getting operators state: ${error.message}`, {
        stack: error.stack,
      });
      throwHTTPError('Internal Error', 500);
    }
  }

  @Get('/metrics')
  async metrics(@Res() res: Response): Promise<void> {
    try {
      const metrics = await this.monitoringService.generatePrometheusMetrics();
      res.set('Content-Type', 'text/plain');
      res.send(metrics);
    } catch (error) {
      this.logger.error(`Error while generating Prometheus metrics: ${error.message}`, {
        stack: error.stack,
      });
      throwHTTPError('Internal Error', 500);
    }
  }

  @Get('/rewards/:address')
  async rewards(
    @Param('address') address: string,
    @Query() query: { currency?: SUPPORTED_CURRENCY },
    @Res() res: Response,
  ): Promise<void> {
    try {
      const rewards = await this.monitoringService.getHistoricalRewards(
        address,
        query.currency || SUPPORTED_CURRENCY.USD,
      );
      res.send({ address, currency: query.currency || SUPPORTED_CURRENCY.USD, rewards });
    } catch (error) {
      this.logger.error(`Error while generating rewards CSV: ${error.message}`, {
        stack: error.stack,
      });
      throwHTTPError('Internal Error', 500);
    }
  }

  @Get('/lyx-price')
  async lyxPrice(
    @Query() query: { currency?: SUPPORTED_CURRENCY; fromBlock?: number; fromTimestamp?: number },
    @Res() res: Response,
  ): Promise<void> {
    try {
      const prices = await this.monitoringService.getLyxPrice(
        query.currency || SUPPORTED_CURRENCY.USD,
        query.fromBlock,
        query.fromTimestamp,
      );
      res.send(prices);
    } catch (error) {
      this.logger.error(`Error while getting LYX price: ${error.message}`, {
        stack: error.stack,
      });
      throwHTTPError('Internal Error', 500);
    }
  }

  @Get('/protocol-checkpoints')
  async protocolCheckpoints(@Res() res: Response): Promise<void> {
    try {
      const checkpoints = await this.monitoringService.getProtocolCheckpoints();
      res.send(checkpoints);
    } catch (error) {
      this.logger.error(`Error while getting protocol checkpoints: ${error.message}`, {
        stack: error.stack,
      });
      throwHTTPError('Internal Error', 500);
    }
  }

  @Get('staking-rewards')
  async stakingRewards(@Res() res: Response): Promise<void> {
    try {
      const rewards = await this.monitoringService.getStakingRewards();
      res.send(rewards);
    } catch (error) {
      this.logger.error(`Error while getting staking rewards: ${error.message}`, {
        stack: error.stack,
      });
      throwHTTPError('Internal Error', 500);
    }
  }
}
