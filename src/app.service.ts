import { Injectable } from '@nestjs/common';
import { formatEther, parseEther } from 'ethers';

import { EthersService } from './ethers/ethers.service';
import { DbClientService } from './db-client/db-client.service';
import { CONTRACT_POOL, CONTRACT_REWARDS, ORCHESTRATOR_KEY_ADDRESS } from './globals';
import { RewardsContractStateDto } from './dto/rewards-contract-state.dto';
import { SLyxContractStateDto } from './dto/slyx-contract-state.dto';
import { PoolContractStateDto } from './dto/pool-contract-state.dto';
import { LiquidityPoolContractStateDto } from './dto/liquidity-pool-contract-state.dto';
import { SUPPORTED_CURRENCY } from './rewards-tracking/types';
import { RewardsBalance } from './db-client/types';
import { RewardsTrackingService } from './rewards-tracking/rewards-tracking.service';
import { StakingRewards } from './types/staking-rewards';
import { OPERATOR_SLUG } from './types/enums';

@Injectable()
export class AppService {
  constructor(
    protected readonly ethersService: EthersService,
    protected readonly rewardTracking: RewardsTrackingService,
    protected readonly dbClient: DbClientService,
  ) {}

  async fetchProtocolState(): Promise<{
    stakers: number;
    totalStaked: number;
    APR: number;
    APY: number;
    activatedValidators: number;
    pendingValidators: number;
    exitedValidators: number;
  }> {
    const stakers = await this.dbClient.fetchNumberOfStakers();
    const pendingValidators = await this.ethersService.pendingValidators();
    const activatedValidators = await this.ethersService.activatedValidators();
    const exitedValidators = await this.ethersService.exitedValidators();
    const poolBalance = await this.ethersService.balanceOf(CONTRACT_POOL);
    const totalStaked =
      (Number(pendingValidators) + Number(activatedValidators) - Number(exitedValidators)) * 32 +
      parseInt(formatEther(poolBalance));

    const APR = await this.getSevenDaysAPR();
    const APY = ((1 + APR / 100 / 365) ** 365 - 1) * 100;
    return {
      stakers,
      totalStaked,
      APR,
      APY,
      activatedValidators: Number(activatedValidators),
      pendingValidators: Number(pendingValidators),
      exitedValidators: Number(exitedValidators),
    };
  }

  async fetchRewardsContractState(): Promise<RewardsContractStateDto> {
    const [
      contractBalance,
      protocolFee,
      totalRewards,
      totalFeesCollected,
      totalCashedOut,
      rewardPerToken,
      totalAvailableRewards,
    ] = await Promise.all([
      this.ethersService.balanceOf(CONTRACT_REWARDS),
      this.ethersService.protocolFee(),
      this.ethersService.totalRewards(),
      this.ethersService.totalFeesCollected(),
      this.ethersService.totalCashedOut(),
      this.ethersService.rewardPerToken(),
      this.ethersService.totalAvailableRewards(),
    ]);

    return {
      contractBalance: contractBalance.toString(),
      protocolFee: parseInt(protocolFee.toString()) / 100,
      totalRewards: totalRewards.toString(),
      totalFeesCollected: totalFeesCollected.toString(),
      totalCashedOut: totalCashedOut.toString(),
      rewardPerToken: rewardPerToken.toString(),
      totalAvailableRewards: totalAvailableRewards.toString(),
    };
  }

  async fetchOperatorTotalRewards(): Promise<{ operator: string; totalRewards: string }[]> {
    const operators = await this.dbClient.getOperators();
    const rewards = await Promise.all(
      operators.map((operator) => {
        return this.dbClient.fetchRewardsBalances(operator.address, 1);
      }),
    );

    return rewards
      .filter((reward) => reward.length > 0)
      .map((reward) => {
        return {
          operator: reward[0].address,
          totalRewards: reward[0].totalRewards,
        };
      });
  }

  async fetchSLyxContractState(): Promise<SLyxContractStateDto> {
    const [
      totalClaimableUnstakes,
      totalPendingUnstake,
      totalUnstaked,
      unstakeRequestCount,
      unstakeRequestCurrentIndex,
      unstakeProcessing,
      totalSupply,
    ] = await Promise.all([
      this.ethersService.totalClaimableUnstakes(),
      this.ethersService.totalPendingUnstake(),
      this.ethersService.totalUnstaked(),
      this.ethersService.unstakeRequestCount(),
      this.ethersService.unstakeRequestCurrentIndex(),
      this.ethersService.unstakeProcessing(),
      this.ethersService.sLyxTotalSupply(),
    ]);

    return {
      totalClaimableUnstakes: totalClaimableUnstakes.toString(),
      totalPendingUnstake: totalPendingUnstake.toString(),
      totalUnstaked: totalUnstaked.toString(),
      unstakeRequestCount: parseInt(unstakeRequestCount.toString()),
      unstakeRequestCurrentIndex: parseInt(unstakeRequestCurrentIndex.toString()),
      unstakeProcessing,
      totalSupply: totalSupply.toString(),
    };
  }

  async fetchPoolContractState(): Promise<PoolContractStateDto> {
    const [
      contractBalance,
      activatedValidators,
      exitedValidators,
      pendingValidators,
      minActivatingDeposit,
      pendingValidatorsLimit,
    ] = await Promise.all([
      this.ethersService.balanceOf(CONTRACT_POOL),
      this.ethersService.activatedValidators(),
      this.ethersService.exitedValidators(),
      this.ethersService.pendingValidators(),
      this.ethersService.minActivatingDeposit(),
      this.ethersService.pendingValidatorsLimit(),
    ]);

    return {
      contractBalance: contractBalance.toString(),
      activatedValidators: parseInt(activatedValidators.toString()),
      exitedValidators: parseInt(exitedValidators.toString()),
      pendingValidators: parseInt(pendingValidators.toString()),
      minActivatingDeposit: minActivatingDeposit.toString(),
      pendingValidatorsLimit: parseInt(pendingValidatorsLimit.toString()),
    };
  }

  async fetchLiquidityPoolContractState(): Promise<LiquidityPoolContractStateDto> {
    const [totalSupply, reserves] = await Promise.all([
      this.ethersService.totalSupplyOfLiquidityPair(),
      this.ethersService.getReserves(),
    ]);

    return {
      totalSupply: totalSupply.toString(),
      reserveLyx: reserves[0].toString(),
      reserveSLyx: reserves[1].toString(),
    };
  }

  async generatePrometheusMetrics(): Promise<string> {
    const orchestratorBalance = await this.ethersService.balanceOf(ORCHESTRATOR_KEY_ADDRESS);

    const [
      rewardsContractState,
      slyxContractState,
      poolContractState,
      liquidityPoolContractState,
      stakers,
      activeValidators,
      pendingValidators,
      exitedValidators,
      operatorTotalRewards,
    ] = await Promise.all([
      this.fetchRewardsContractState(),
      this.fetchSLyxContractState(),
      this.fetchPoolContractState(),
      this.fetchLiquidityPoolContractState(),
      this.dbClient.fetchNumberOfStakers(),
      this.dbClient.countEffectiveValidatorsPerOperator(),
      this.dbClient.countPendingValidatorsPerOperator(),
      this.dbClient.countExitedValidatorsPerOperator(),
      this.fetchOperatorTotalRewards(),
    ]);

    // Convert the data to Prometheus format
    let metrics = '# TYPE your_metric_name_here counter\n'; // Example metric type definition
    metrics += `orchestrator_key_balance ${orchestratorBalance.toString()}\n`;
    metrics += `rewards_contract_balance ${rewardsContractState.contractBalance}\n`;
    metrics += `rewards_contract_total_rewards ${rewardsContractState.totalRewards}\n`;
    metrics += `rewards_contract_total_fees_collected ${rewardsContractState.totalFeesCollected}\n`;
    metrics += `rewards_contract_total_cashed_out ${rewardsContractState.totalCashedOut}\n`;
    metrics += `rewards_contract_reward_per_token ${rewardsContractState.rewardPerToken}\n`;
    metrics += `rewards_contract_total_available_rewards ${rewardsContractState.totalAvailableRewards}\n`;
    metrics += `slyx_contract_total_claimable_unstakes ${slyxContractState.totalClaimableUnstakes}\n`;
    metrics += `slyx_contract_total_pending_unstake ${slyxContractState.totalPendingUnstake}\n`;
    metrics += `slyx_contract_total_unstaked ${slyxContractState.totalUnstaked}\n`;
    metrics += `slyx_contract_unstake_request_count ${slyxContractState.unstakeRequestCount}\n`;
    metrics += `slyx_contract_unstake_request_current_index ${slyxContractState.unstakeRequestCurrentIndex}\n`;
    metrics += `# Slyx_contract_unstake_processing 1=true 0=false\n`;
    metrics += `slyx_contract_unstake_processing ${
      slyxContractState.unstakeProcessing === true ? 1 : 0
    }\n`;
    metrics += `slyx_contract_total_supply ${slyxContractState.totalSupply}\n`;
    metrics += `pool_contract_balance ${poolContractState.contractBalance}\n`;
    metrics += `pool_contract_activated_validators ${poolContractState.activatedValidators}\n`;
    metrics += `pool_contract_exited_validators ${poolContractState.exitedValidators}\n`;
    metrics += `pool_contract_pending_validators ${poolContractState.pendingValidators}\n`;
    metrics += `pool_contract_min_activating_deposit ${poolContractState.minActivatingDeposit}\n`;
    metrics += `pool_contract_pending_validators_limit ${poolContractState.pendingValidatorsLimit}\n`;
    metrics += `liquidity_pool_contract_total_supply ${liquidityPoolContractState.totalSupply}\n`;
    metrics += `liquidity_pool_contract_reserve_lyx ${liquidityPoolContractState.reserveLyx}\n`;
    metrics += `liquidity_pool_contract_reserve_slyx ${liquidityPoolContractState.reserveSLyx}\n`;
    metrics += `stakers ${stakers}\n`;
    for (const operator of activeValidators) {
      metrics += `active_validators{operator="${operator.operator}"} ${operator.count}\n`;
    }
    for (const operator of pendingValidators) {
      metrics += `pending_validators{operator="${operator.operator}"} ${operator.count}\n`;
    }
    for (const operator of exitedValidators) {
      metrics += `exited_validators{operator="${operator.operator}"} ${operator.count}\n`;
    }
    for (const operator of operatorTotalRewards) {
      metrics += `operator_total_rewards{operator="${operator.operator}"} ${operator.totalRewards}\n`;
    }

    return metrics;
  }

  async getHistoricalRewards(
    address: string,
    currency: SUPPORTED_CURRENCY,
  ): Promise<(Omit<RewardsBalance, 'address'> & { price: number | undefined })[]> {
    const rewards = await this.dbClient.fetchRewardsBalances(address);
    const lyxPrices = await this.dbClient.fetchLyxPrices();

    return rewards.map((row) => {
      return {
        blockNumber: row.blockNumber,
        blockDate: row.blockDate,
        currentBalance: row.currentBalance,
        balanceChange: row.balanceChange,
        totalRewards: row.totalRewards,
        price: lyxPrices.find((price) => price.blockNumber === row.blockNumber)?.[currency],
        balanceSLyx: row.balanceSLyx,
      };
    });
  }

  public async fetchOperatorsState(): Promise<
    {
      address: string;
      activatedValidators: number;
      pendingValidators: number;
      exitedValidators: number;
    }[]
  > {
    const response = await this.dbClient.fetchLastOperatorCheckpointPerOperator();
    return response.map((row) => {
      return {
        address: row.operator,
        activatedValidators: row.activeValidators,
        pendingValidators: row.pendingValidators,
        exitedValidators: row.exitedValidators,
      };
    });
  }

  protected async getSevenDaysAPR(): Promise<number> {
    const FACTORING = 1_000_000;
    const FACTORING_BN = BigInt(FACTORING);

    const sevenDaysInBlocks = 48_774;
    const currentBlock: number = await this.ethersService.fetchCurrentBlockNumber();
    const rewardsUpdatedEvents = await this.ethersService.fetchRewardsUpdatedEvents(
      currentBlock - sevenDaysInBlocks,
    );
    const rewardUpdateVotes = await this.ethersService.fetchRewardsVotes(
      currentBlock - sevenDaysInBlocks,
    );

    const sevenDaysRewards = rewardsUpdatedEvents.reduce(
      (acc, event) => acc + BigInt(event.args.periodRewards),
      BigInt(0),
    );
    const sumEffectiveValidators = rewardUpdateVotes.reduce(
      (acc, event) =>
        acc + Number(event.args.activatedValidators) - Number(event.args.exitedValidators),
      0,
    );
    
    if (rewardUpdateVotes.length === 0) return 0;

    const avSLyxSevenDays = parseEther(
      ((sumEffectiveValidators / rewardUpdateVotes.length) * 32).toString(),
    );

    return (
      (Number(((sevenDaysRewards * FACTORING_BN) / avSLyxSevenDays / BigInt(7)) * BigInt(365)) /
        FACTORING) *
      100
    );
  }

  public async getLyxPrice(
    currency: SUPPORTED_CURRENCY,
    fromBlock?: number,
    fromTimestamp?: number,
  ): Promise<{
    currency: SUPPORTED_CURRENCY;
    price: { value: number; blockNumber: number; date: Date }[];
  }> {
    const response = await this.dbClient.fetchLyxPrices(
      fromBlock,
      fromTimestamp,
      fromBlock || fromTimestamp ? undefined : 1,
    );
    return {
      currency,
      price: response.map((row) => {
        return {
          value: row[currency],
          blockNumber: row.blockNumber,
          date: row.date,
        };
      }),
    };
  }

  public async getStakingRewards(): Promise<StakingRewards> {
    const lyxPrices = await this.dbClient.fetchLyxPrices(undefined, undefined, 1);
    const latestPrice = lyxPrices[lyxPrices.length - 1].usd;
    const protocolState = await this.fetchProtocolState();
    const sLyxTotalSupply = await this.ethersService.sLyxTotalSupply();
    const operatorState = await this.fetchOperatorsState();

    return {
      name: 'LEEQUID',
      totalUsers: protocolState.stakers,
      totalBalanceUsd: protocolState.totalStaked * latestPrice,
      supportedAssets: [
        {
          symbol: 'sLYX',
          slug: 'staked-lyx-token',
          baseSlug: 'lukso-token-2',
          supply: parseInt(formatEther(sLyxTotalSupply)),
          apr: protocolState.APR,
          fee: 10,
          users: protocolState.stakers,
          unstakingTime: 60 * 60 * 24 * 2,
          exchangeRatio: 1,
          validators: protocolState.activatedValidators - protocolState.exitedValidators,
          nodeOperators: operatorState.length,
          nodeOperatorBreakdown: operatorState
            .filter((operator) => OPERATOR_SLUG[operator.address])
            .map((operator) => {
              return {
                operatorSlug: OPERATOR_SLUG[operator.address],
                balance: (operator.activatedValidators - operator.exitedValidators) * 32,
                fee: 5,
                validators: operator.activatedValidators - operator.exitedValidators,
                validatorBreakdown: [],
              };
            }),
        },
      ],
    };
  }
}
