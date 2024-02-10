import { Injectable } from '@nestjs/common';
import winston from 'winston';
import pLimit from 'p-limit';

import { EthersService } from '../ethers/ethers.service';
import { LoggerService } from '../logger/logger.service';
import { FetcherService } from '../fetcher/fetcher.service';
import { DbClientService } from '../db-client/db-client.service';
import { DebugLogger } from '../decorators/debug-logging.decorator';
import { OperatorAddedEvent } from '../ethers/events';
import { DepositDataProofDto } from '../dto/deposit-data.dto';
import { VALIDATOR_STATUS } from '../types/enums';
import { ClientApiService } from '../client-api/client-api.service';
import { ExceptionHandler } from '../decorators/exception-handler.decorator';
import { P_LIMIT } from '../globals';

const limit = pLimit(P_LIMIT);

@Injectable()
export class ValidatorsService {
  protected logger: winston.Logger;

  constructor(
    protected readonly ethersService: EthersService,
    protected readonly loggerService: LoggerService,
    protected readonly fetcherService: FetcherService,
    protected readonly dbService: DbClientService,
    protected readonly clientAPI: ClientApiService,
  ) {
    this.logger = this.loggerService.getChildLogger('ValidatorsService');
  }

  @DebugLogger()
  @ExceptionHandler(false)
  public async createOperatorsCheckpoint(): Promise<void> {
    const currentBlock = await this.ethersService.fetchCurrentBlockNumber();
    const operators = await this.dbService.getOperators();
    const activeValidators = await this.dbService.countEffectiveValidatorsPerOperator();
    const pendingValidators = await this.dbService.countPendingValidatorsPerOperator();
    const exitedValidators = await this.dbService.countExitedValidatorsPerOperator();

    for (const operator of operators) {
      await this.dbService.insertOperatorCheckpoint(
        currentBlock,
        operator.address,
        activeValidators.find((v) => v.operator === operator.address)?.count || 0,
        pendingValidators.find((v) => v.operator === operator.address)?.count || 0,
        exitedValidators.find((v) => v.operator === operator.address)?.count || 0,
      );
    }
  }

  @DebugLogger()
  @ExceptionHandler(false, false)
  public async updateValidators(): Promise<void> {
    const syncingStatus = await this.clientAPI.fetchSyncingStatus();
    if (syncingStatus.is_syncing) throw new Error('Beacon node is not synced');

    const checkpoint = await this.getValidatorsCheckpointBlock();
    const currentBlock = await this.ethersService.fetchCurrentBlockNumber();
    const operatorAddedEvents = await this.ethersService.fetchOperatorAddedEvents(checkpoint + 1);

    for (const event of operatorAddedEvents) await this.processNewOperatorAdded(event);
    await this.dbService.updateValidatorsCheckpoint(currentBlock);

    await this.fetchAndUpdateValidatorsStatus(syncingStatus.head_slot);
  }

  @DebugLogger()
  protected async fetchAndSaveNonRegisteredValidators(event: OperatorAddedEvent): Promise<void> {
    const { operator, depositDataMerkleProofs } = event.args;

    const depositData = await this.fetcherService.fetch<DepositDataProofDto[]>(
      depositDataMerkleProofs,
      {},
      4,
      200,
    );
    await this.insertValidators(depositData, operator);
  }

  @DebugLogger()
  protected async processNewOperatorAdded(event: OperatorAddedEvent): Promise<void> {
    if (event.args.depositDataMerkleProofs.length <= 2) return;
    const operator = await this.dbService.getOperator(event.args.operator);
    if (!operator) {
      await this.dbService.insertOperator(event.args.operator, event.args.depositDataMerkleRoot);
    } else {
      // If same merkle root, no need to update as the validators are the same
      if (operator.merkleRoot === event.args.depositDataMerkleRoot) return;
      else
        await this.dbService.updateOperator(event.args.operator, event.args.depositDataMerkleRoot);
    }
    await this.fetchAndSaveNonRegisteredValidators(event);
  }

  @DebugLogger()
  protected async insertValidators(
    depositData: DepositDataProofDto[],
    operator: string,
  ): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const [index, data] of depositData.entries()) {
      try {
        await this.dbService.insertValidator({
          ...data,
          operator,
          status: VALIDATOR_STATUS.NON_REGISTERED,
        });
      } catch (e) {
        if (!e.message.includes('duplicate')) {
          this.logger.error(`Error inserting validator ${data.publicKey}: ${e.message}`);
          throw e;
        }
      }
    }
  }

  @DebugLogger()
  protected async fetchAndUpdateValidatorsStatus(slot: string): Promise<void> {
    const nonExitedValidators = await this.dbService.fetchNonExitedValidatorIds();
    this.logger.info(`Updating ${nonExitedValidators.length} validators`);
    const promises = nonExitedValidators.map((validator) =>
      limit(() => this.fetchAndUpdateValidator(slot, validator)),
    );

    await Promise.all(promises);
  }

  protected async fetchAndUpdateValidator(slot: string, validator: string): Promise<void> {
    try {
      const validatorData = await this.clientAPI.fetchValidatorData(slot, validator);
      await this.dbService.updateValidator(validator, validatorData.status);
    } catch (e) {
      this.logger.error(`Error updating validator ${validator}: ${e.message}`);
    }
  }

  @DebugLogger()
  protected async getValidatorsCheckpointBlock(): Promise<number> {
    const checkpoint = await this.dbService.getCheckpoint();
    return checkpoint.validatorsCheckpointBlock;
  }

  @DebugLogger()
  public async isBeaconNodeSynced(): Promise<boolean> {
    const syncingStatus = await this.clientAPI.fetchSyncingStatus();
    return !syncingStatus.is_syncing;
  }
}
