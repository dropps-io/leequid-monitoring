import { Injectable } from '@nestjs/common';
import winston from 'winston';
import { parseEther } from 'ethers';
import axios from 'axios';

import { LoggerService } from '../logger/logger.service';
import { EthersService } from '../ethers/ethers.service';
import { DebugLogger } from '../decorators/debug-logging.decorator';
import { DbClientService } from '../db-client/db-client.service';
import { CONSENSUS_API_URL, CONTRACT_POOL } from '../globals';
import { ExceptionHandler } from '../decorators/exception-handler.decorator';

@Injectable()
export class ProtocolCheckpointService {
  private readonly logger: winston.Logger;

  constructor(
    protected readonly loggerService: LoggerService,
    protected readonly ethersService: EthersService,
    protected readonly dbClient: DbClientService,
  ) {
    this.logger = loggerService.getChildLogger('ProtocolCheckpointService');
  }

  @DebugLogger()
  @ExceptionHandler(false, false)
  public async createProtocolCheckpoint(): Promise<void> {
    const [
      blockNumber,
      poolBalance,
      totalRewards,
      totalFeesCollected,
      totalSLyx,
      totalUnstaked,
      activatedValidators,
      exitedValidators,
      pendingValidators,
      lpReserves,
      stakers,
      totalValidators,
    ] = await Promise.all([
      this.ethersService.fetchCurrentBlockNumber(),
      this.ethersService.balanceOf(CONTRACT_POOL),
      this.ethersService.totalRewards(),
      this.ethersService.totalFeesCollected(),
      this.ethersService.sLyxTotalSupply(),
      this.ethersService.totalUnstaked(),
      this.ethersService.activatedValidators(),
      this.ethersService.exitedValidators(),
      this.ethersService.pendingValidators(),
      this.ethersService.getReserves(),
      this.dbClient.fetchNumberOfStakers(),
      this.fetchTotalValidators(),
    ]);

    const totalStaked =
      parseEther(
        (
          (Number(pendingValidators) + Number(activatedValidators) - Number(exitedValidators)) *
          32
        ).toString(),
      ) + poolBalance;

    const lpLyx = lpReserves[0].toString();
    const lpSLyx = lpReserves[1].toString();

    const aprOnSLyx = await this.get24hAPR(blockNumber, BigInt(totalSLyx));
    const aprOnActivated = await this.get24hAPR(
      blockNumber,
      parseEther(((activatedValidators - exitedValidators) * BigInt(32)).toString()),
    );

    const protocolCheckpoint = {
      date: new Date(),
      blockNumber,
      totalStaked: totalStaked.toString(),
      totalRewards: totalRewards.toString(),
      totalFeesCollected: totalFeesCollected.toString(),
      totalSLyx: totalSLyx.toString(),
      totalUnstaked: totalUnstaked.toString(),
      activatedValidators: Number(activatedValidators),
      exitedValidators: Number(exitedValidators),
      pendingValidators: Number(pendingValidators),
      aprOnSLyx: aprOnSLyx ? aprOnSLyx.toFixed(5).toString() : '0',
      aprOnActivated: aprOnActivated ? aprOnActivated.toFixed(5).toString(): '0',
      lpSLyx,
      lpLyx,
      stakers,
      totalValidators,
    };

    await this.dbClient.insertProtocolCheckpoint(protocolCheckpoint);
  }

  protected async fetchTotalValidators(): Promise<number> {
    const uri = `${CONSENSUS_API_URL}/api/v1/epoch/latest`;
    const response = await axios.get(uri);
    return response.data.data.validatorscount;
  }

  protected async get24hAPR(blockNumber: number, denominator: bigint): Promise<number> {
    const FACTORING = 1_000_000;
    const FACTORING_BN = BigInt(FACTORING);

    const dayInBlocks = 6_968;
    const rewardsUpdatedEvents = await this.ethersService.fetchRewardsUpdatedEvents(
      blockNumber - dayInBlocks,
      blockNumber,
    );

    const rewards = rewardsUpdatedEvents.reduce(
      (acc, event) => acc + BigInt(event.args.periodRewards),
      BigInt(0),
    );

    return (Number(((rewards * FACTORING_BN) / denominator) * BigInt(365)) / FACTORING) * 100;
  }
}
