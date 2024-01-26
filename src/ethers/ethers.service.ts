import { Injectable } from '@nestjs/common';
import { Contract, JsonRpcProvider } from 'ethers';
import winston from 'winston';
import rewardAbi from '../abi/Rewards.json';
import stakedLyxTokenAbi from '../abi/StakedLyxToken.json';
import poolAbi from '../abi/Pool.json';
import uniswapPair from '../abi/UniswapV2Pair.json';
import merkleDistributorABI from '../abi/MerkleDistributor.json';

import {
  CONTRACT_REWARDS,
  RPC_URL,
  CONTRACT_SLYX,
  CONTRACT_POOL,
  LIQUIDITY_POOLS,
  CONTRACT_MERKLE_DISTRIBUTOR,
} from '../globals';
import { MerkleRootUpdatedEvent, RewardsUpdatedEvent } from './events';
import { CashoutEvent } from '../types/events';
import {LoggerService} from "../logger/logger.service";
import {DebugLogger} from "../decorators/debug-logging.decorator";

@Injectable()
export class EthersService {
  private readonly provider: JsonRpcProvider;
  private readonly logger: winston.Logger;

  private rewardsContract: Contract;
  private stakedLyxToken: Contract;
  private pool: Contract;
  private liquidityPair: Contract;
  private merkleDistributor: Contract;

  constructor(protected readonly loggerService: LoggerService) {
    // Initialize provider with RPC URL
    this.provider = new JsonRpcProvider(RPC_URL);

    // Initialize logger
    this.logger = loggerService.getChildLogger('EthersService');

    this.rewardsContract = new Contract(CONTRACT_REWARDS, rewardAbi, this.provider);
    this.stakedLyxToken = new Contract(CONTRACT_SLYX, stakedLyxTokenAbi, this.provider);
    this.pool = new Contract(CONTRACT_POOL, poolAbi, this.provider);
    this.liquidityPair = new Contract(LIQUIDITY_POOLS[0], uniswapPair, this.provider);
    this.merkleDistributor = new Contract(
      CONTRACT_MERKLE_DISTRIBUTOR,
      merkleDistributorABI,
      this.provider,
    );
  }

  @DebugLogger()
  public async fetchCurrentBlockNumber(): Promise<number> {
    return await this.provider.getBlockNumber();
  }

  public async getBlockTimestamp(blockNumber: number): Promise<number> {
    const block = await this.provider.getBlock(blockNumber);
    if (!block || !block.timestamp) {
      throw new Error('Block details could not be retrieved');
    }
    return block.timestamp * 1000;
  }

  public async balanceOf(address: string): Promise<bigint> {
    return await this.provider.getBalance(address);
  }

  /* ------- MERKLE DISTRIBUTOR ------- */

  public async fetchLatestMerkleRootUpdatedEvent(): Promise<MerkleRootUpdatedEvent> {
    const provider = new JsonRpcProvider(RPC_URL);
    const blockNumber = await provider.getBlockNumber();
    const events = (await this.merkleDistributor.queryFilter(
      'MerkleRootUpdated',
      blockNumber - 10000,
    )) as unknown as MerkleRootUpdatedEvent[];

    if (events.length === 0) throw new Error('No MerkleRootUpdated event found');
    else return events[events.length - 1];
  }

  public async isMerkleDistributionClaimed(index: number): Promise<boolean> {
    return this.merkleDistributor.isClaimed(index);
  }

  /* ------- REWARDS CONTRACT ------- */

  public async rewardsBalanceOf(address: string): Promise<bigint> {
    return await this.rewardsContract.balanceOf(address);
  }

  public async totalAvailableRewards(): Promise<bigint> {
    return await this.rewardsContract.totalAvailableRewards();
  }
  public async protocolFeeRecipient(): Promise<string> {
    return await this.rewardsContract.protocolFeeRecipient();
  }

  public async protocolFee(): Promise<bigint> {
    return await this.rewardsContract.protocolFee();
  }

  public async totalFeesCollected(): Promise<bigint> {
    return await this.rewardsContract.totalFeesCollected();
  }
  public async totalCashedOut(): Promise<bigint> {
    return await this.rewardsContract.totalCashedOut();
  }

  public async rewardPerToken(): Promise<bigint> {
    return await this.rewardsContract.rewardPerToken();
  }

  public async totalRewards(): Promise<bigint> {
    return await this.rewardsContract.totalRewards();
  }

  @DebugLogger()
  public async fetchLastRewardsUpdateBlockNumber(): Promise<number> {
    const res = await this.rewardsContract.lastUpdateBlockNumber();
    return parseInt(res.toString());
  }

  @DebugLogger()
  public async fetchRewardsUpdatedEventAtBlock(block: number): Promise<RewardsUpdatedEvent> {
    const res = (await this.rewardsContract.queryFilter(
      'RewardsUpdated',
      block,
      block,
    )) as unknown as RewardsUpdatedEvent[];

    if (!res || res.length === 0)
      throw new Error(`No RewardsUpdated event found at block ${block}`);
    return res[0];
  }

  public async fetchCashOutEventsFor(address: string, fromBlock: number): Promise<CashoutEvent[]> {
    const filter = this.rewardsContract.filters.RewardsCashedOut(address);
    return (await this.rewardsContract.queryFilter(filter, fromBlock)) as unknown as CashoutEvent[];
  }

  public async fetchCompoundEventsFor(address: string, fromBlock: number): Promise<CashoutEvent[]> {
    const filter = this.rewardsContract.filters.RewardsCompounded(address);
    return (await this.rewardsContract.queryFilter(filter, fromBlock)) as unknown as CashoutEvent[];
  }

  /* ------- SLYX CONTRACT ------- */

  public async totalClaimableUnstakes(): Promise<bigint> {
    return await this.stakedLyxToken.totalClaimableUnstakes();
  }

  public async totalPendingUnstake(): Promise<bigint> {
    return await this.stakedLyxToken.totalPendingUnstake();
  }

  public async totalUnstaked(): Promise<bigint> {
    return await this.stakedLyxToken.totalUnstaked();
  }

  public async unstakeRequestCount(): Promise<bigint> {
    return await this.stakedLyxToken.unstakeRequestCount();
  }

  public async unstakeRequestCurrentIndex(): Promise<bigint> {
    return await this.stakedLyxToken.unstakeRequestCurrentIndex();
  }

  public async unstakeProcessing(): Promise<boolean> {
    return await this.stakedLyxToken.unstakeProcessing();
  }

  public async totalSupply(): Promise<bigint> {
    return await this.stakedLyxToken.totalSupply();
  }

  /* ------- POOL CONTRACT ------- */

  public async activatedValidators(): Promise<bigint> {
    return await this.pool.activatedValidators();
  }

  public async pendingValidators(): Promise<bigint> {
    return await this.pool.pendingValidators();
  }

  public async exitedValidators(): Promise<bigint> {
    return await this.pool.exitedValidators();
  }

  public async minActivatingDeposit(): Promise<bigint> {
    return await this.pool.minActivatingDeposit();
  }

  public async pendingValidatorsLimit(): Promise<bigint> {
    return await this.pool.pendingValidatorsLimit();
  }

  /* ------- LIQUIDITY PAIR ------- */

  public async totalSupplyOfLiquidityPair(): Promise<bigint> {
    return await this.liquidityPair.totalSupply();
  }

  public async getReserves(): Promise<bigint[]> {
    return await this.liquidityPair.getReserves();
  }
}
