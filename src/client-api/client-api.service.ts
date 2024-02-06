import { Injectable } from '@nestjs/common';
import axios from 'axios';
import winston from 'winston';

import { LoggerService } from '../logger/logger.service';
import { DebugLogger } from '../decorators/debug-logging.decorator';
import { ValidatorResponse } from '../types/validator-response';
import { BEACON_API_URL, WITHDRAWAL_CREDENTIALS } from '../globals';

interface WithdrawalItem {
  address: string;
  amount: string;
}

/**
 * Service to interact with the Consensus API
 */
@Injectable()
export class ClientApiService {
  protected logger: winston.Logger;

  constructor(protected readonly loggerService: LoggerService) {
    this.logger = loggerService.getChildLogger('ClientApi');
  }

  /**
   * Fetches validator data from the Consensus API.
   *
   * @returns {Promise<ValidatorResponse[]>} The validator response.
   */
  @DebugLogger()
  async fetchActivatedValidatorsData(slot: string): Promise<ValidatorResponse[]> {
    const requestUrl = `${BEACON_API_URL}/eth/v1/beacon/states/${slot}/validators`;
    this.logger.debug(`Fetching validators data from beacon API at: ${requestUrl}`);

    const response = await axios.get<{ data: ValidatorResponse[] }>(requestUrl);
    this.logger.debug(
      `Fetched a total of ${response.data.data.length} validators data from the BEACON API`,
    );

    return response.data.data.filter(
      (v) => v.validator.withdrawal_credentials === WITHDRAWAL_CREDENTIALS,
    );
  }

  @DebugLogger()
  async fetchValidatorData(slot: string, pubKey: string): Promise<ValidatorResponse> {
    const requestUrl = `${BEACON_API_URL}/eth/v1/beacon/states/${slot}/validators/${pubKey}`;
    const response = await axios.get<{ data: ValidatorResponse[] }>(requestUrl);

    if (response.data.data.length === 0) throw new Error(`Validator ${pubKey} not found`);
    else return response.data.data[0];
  }

  @DebugLogger()
  async fetchSyncingStatus(): Promise<{ head_slot: string; is_syncing: boolean }> {
    const requestUrl = `${BEACON_API_URL}/eth/v1/node/syncing`;

    const response = await axios.get<{ data: { head_slot: string; is_syncing: boolean } }>(
      requestUrl,
    );

    return response.data.data;
  }
}
