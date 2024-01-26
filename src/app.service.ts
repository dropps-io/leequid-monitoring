import { Injectable } from '@nestjs/common';
import {EthersService} from "./ethers/ethers.service";
import {DbClientService} from "./db-client/db-client.service";
import {CONTRACT_POOL, CONTRACT_REWARDS, ORCHESTRATOR_KEY_ADDRESS} from "./globals";
import {formatEther} from "ethers";
import {RewardsContractStateDto} from "./dto/rewards-contract-state.dto";
import {SLyxContractStateDto} from "./dto/slyx-contract-state.dto";
import {PoolContractStateDto} from "./dto/pool-contract-state.dto";
import {LiquidityPoolContractStateDto} from "./dto/liquidity-pool-contract-state.dto";
import {SUPPORTED_CURRENCY} from "./rewards-tracking/types";
import {RewardsBalance} from "./db-client/types";

@Injectable()
export class AppService {

  constructor(
    protected readonly ethersService: EthersService,
    protected readonly dbClient: DbClientService,
  ) {
  }

  async fetchProtocolState(): Promise<{ stakers: number; totalStaked: number }> {
    const stakers = await this.dbClient.fetchNumberOfStakers();
    const pendingValidators = await this.ethersService.pendingValidators();
    const activatedValidators = await this.ethersService.activatedValidators();
    const poolBalance = await this.ethersService.balanceOf(CONTRACT_POOL);
    const totalStaked =
      (Number(pendingValidators) + Number(activatedValidators)) * 32 +
      parseInt(formatEther(poolBalance));
    return { stakers, totalStaked };
  }

  async fetchRewardsContractState(): Promise<RewardsContractStateDto> {
    const [
      contractBalance,
      protocolFeeRecipient,
      protocolFee,
      totalRewards,
      totalFeesCollected,
      totalCashedOut,
      rewardPerToken,
      totalAvailableRewards,
    ] = await Promise.all([
      this.ethersService.balanceOf(CONTRACT_REWARDS),
      this.ethersService.protocolFeeRecipient(),
      this.ethersService.protocolFee(),
      this.ethersService.totalRewards(),
      this.ethersService.totalFeesCollected(),
      this.ethersService.totalCashedOut(),
      this.ethersService.rewardPerToken(),
      this.ethersService.totalAvailableRewards(),
    ]);

    const feeRecipientRewardsBalance = await this.ethersService.rewardsBalanceOf(
      protocolFeeRecipient,
    );

    return {
      contractBalance: contractBalance.toString(),
      protocolFeeRecipient,
      feeRecipientRewardsBalance: feeRecipientRewardsBalance.toString(),
      protocolFee: parseInt(protocolFee.toString()) / 100,
      totalRewards: totalRewards.toString(),
      totalFeesCollected: totalFeesCollected.toString(),
      totalCashedOut: totalCashedOut.toString(),
      rewardPerToken: rewardPerToken.toString(),
      totalAvailableRewards: totalAvailableRewards.toString(),
    };
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
      this.ethersService.totalSupply(),
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
    ] = await Promise.all([
      this.fetchRewardsContractState(),
      this.fetchSLyxContractState(),
      this.fetchPoolContractState(),
      this.fetchLiquidityPoolContractState(),
      this.dbClient.fetchNumberOfStakers(),
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
    metrics += `rewards_contract_fee_recipient_rewards_balance ${rewardsContractState.feeRecipientRewardsBalance}\n`;
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

    // Add more metrics from rewardsContractState, slyxContractState, etc.

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
      };
    });
  }
}
