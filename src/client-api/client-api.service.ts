import { Injectable } from '@nestjs/common';
import axios from 'axios';
import winston from 'winston';

import { LoggerService } from '../logger/logger.service';
import { DebugLogger } from '../decorators/debug-logging.decorator';
import { ValidatorResponse } from '../types/validator-response';
import { BEACON_API_URL } from '../globals';

/**
 * Service to interact with the Consensus API
 */
@Injectable()
export class ClientApiService {
  protected logger: winston.Logger;

  constructor(protected readonly loggerService: LoggerService) {
    this.logger = loggerService.getChildLogger('ClientApi');
  }

  async fetchValidatorData(slot: string, pubKey: string): Promise<ValidatorResponse> {
    const requestUrl = `${BEACON_API_URL}/eth/v1/beacon/states/${slot}/validators/${pubKey}`;
    const response = await axios.get<{ data: ValidatorResponse }>(requestUrl);
    return response.data.data;
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
