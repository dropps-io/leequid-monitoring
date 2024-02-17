import { Injectable } from '@nestjs/common';
import winston from 'winston';
import pLimit from 'p-limit';

import { EthersService } from '../ethers/ethers.service';
import { DbClientService } from '../db-client/db-client.service';
import { CashoutEvent } from '../types/events';
import { COINGECKO_API_URL, COINGECKO_LYX_ID } from '../globals';
import { LyxPriceTable, RewardsBalance } from '../db-client/types';
import { LoggerService } from '../logger/logger.service';
import { FetcherService } from '../fetcher/fetcher.service';
import { DebugLogger } from '../decorators/debug-logging.decorator';
import { PreventOverlap } from '../decorators/prevent-overlap.decorator';
import { ExceptionHandler } from '../decorators/exception-handler.decorator';
import {
  MerkleDistribution,
  MerkleDistributions,
  MerkleResponse,
} from '../types/merkle-distribution';

const limit = pLimit(10); // limit to 5 concurrent promises

@Injectable()
export class RewardsTrackingService {
  private readonly logger: winston.Logger;

  constructor(
    protected readonly loggerService: LoggerService,
    protected readonly ethersService: EthersService,
    protected readonly dbClient: DbClientService,
    protected readonly fetcherService: FetcherService,
  ) {
    // Initialize logger
    this.logger = loggerService.getChildLogger('EthersService');
  }

  @DebugLogger()
  @PreventOverlap()
  @ExceptionHandler(false, false)
  public async trackRewards(): Promise<void> {
    const latestMonitoredBlock = await this.dbClient.fetchLastMonitoredBlock();
    const lastRewardsUpdateBlock = await this.ethersService.fetchLastRewardsUpdateBlockNumber();

    if (lastRewardsUpdateBlock <= latestMonitoredBlock) {
      this.logger.info(`Rewards have already been tracked for block ${lastRewardsUpdateBlock}`);
      return;
    }

    await this.getAndSaveLyxePrice(lastRewardsUpdateBlock);

    const timestamp = await this.ethersService.getBlockTimestamp(lastRewardsUpdateBlock);
    const allStakers = await this.dbClient.fetchStakersList();
    const operators = await this.dbClient.getOperators();

    const previousRewardsBalance = await this.dbClient.fetchRewardBalancesAtBlock(
      latestMonitoredBlock,
    );

    const merkleDistribution = await this.fetchMerkleDistribution();

    const promises = [...allStakers, ...operators.map((operator) => operator.address)].map(
      (staker) =>
        limit(async () => {
          return await this.createRewardsBalanceRowFor(
            staker,
            lastRewardsUpdateBlock,
            timestamp,
            latestMonitoredBlock,
            previousRewardsBalance.find((r) => r.address.toLowerCase() === staker.toLowerCase()),
            merkleDistribution[staker] || undefined,
          );
        }),
    );

    const rewardsBalances: RewardsBalance[] = await Promise.all(promises);
    await this.dbClient.batchInsertRewardsBalance(rewardsBalances);
  }

  @DebugLogger()
  protected async createRewardsBalanceRowFor(
    address: string,
    block: number,
    blockTimestamp: number,
    lastMonitoredBlock: number,
    previousRow?: RewardsBalance,
    merkleDis?: MerkleDistribution,
  ): Promise<RewardsBalance> {
    const balanceSLyx = await this.ethersService.sLyxBalanceOf(address);
    let rewardsBalance = await this.ethersService.rewardsBalanceOf(address);
    if (merkleDis && merkleDis.values.length > 0 && BigInt(merkleDis.values[0]) > 0) {
      const isClaimed = await this.ethersService.isMerkleDistributionClaimed(merkleDis.index);
      if (!isClaimed) {
        rewardsBalance += BigInt(merkleDis.values[0]);
      }
    }

    const cashoutEvents = await this.ethersService.fetchCashOutEventsFor(
      address,
      lastMonitoredBlock,
    );
    const compoundEvents = await this.ethersService.fetchCompoundEventsFor(
      address,
      lastMonitoredBlock,
    );
    const allEvents = cashoutEvents.concat(...compoundEvents);
    const eventsSinceBlock = allEvents.filter((e) => e.blockNumber >= block);
    const eventsBeforeBlock = allEvents.filter((e) => e.blockNumber < block);
    rewardsBalance = this.addCashoutsToBalance(rewardsBalance, eventsSinceBlock);
    // Include the amounts that were cashedOut before the current block
    const balanceWithCashouts = this.addCashoutsToBalance(rewardsBalance, eventsBeforeBlock);
    const rewardsBalanceChange = previousRow
      ? balanceWithCashouts - BigInt(previousRow.currentBalance)
      : balanceWithCashouts;

    return {
      address,
      blockNumber: block,
      blockDate: new Date(blockTimestamp),
      currentBalance: rewardsBalance.toString(),
      balanceChange: rewardsBalanceChange.toString(),
      totalRewards: (previousRow
        ? BigInt(previousRow.totalRewards) + rewardsBalanceChange
        : balanceWithCashouts
      ).toString(),
      balanceSLyx: balanceSLyx.toString(),
    };
  }

  @DebugLogger()
  protected addCashoutsToBalance(balance: bigint, events: CashoutEvent[]): bigint {
    balance += events.reduce((acc, event) => acc + event.args.amount, 0n);
    return balance;
  }

  @DebugLogger()
  public async fetchMerkleDistribution(): Promise<MerkleDistributions> {
    const latestMerkleUpdate = await this.ethersService.fetchLatestMerkleRootUpdatedEvent();
    const res = await this.fetcherService.fetch<MerkleResponse>(
      latestMerkleUpdate.args.merkleProofs,
      {},
      3,
      200,
    );

    return res.distribution;
  }

  @DebugLogger()
  protected async getAndSaveLyxePrice(blockNumber: number): Promise<void> {
    const res = await fetch(
      `${COINGECKO_API_URL}/simple/price?ids=${COINGECKO_LYX_ID}&vs_currencies=usd,eur,jpy,gbp,aud,cad,chf,cny,hkd,inr`,
    );
    const data = await res.json();
    const toInsert: LyxPriceTable = { blockNumber, ...data[COINGECKO_LYX_ID] };
    await this.dbClient.insertLyxPriceTable(toInsert);
  }
}
