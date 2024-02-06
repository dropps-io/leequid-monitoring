import { Injectable } from '@nestjs/common';
import { Pool, QueryResult } from 'pg';
import winston from 'winston';

import { CONTRACT_SLYX, INDEXING_CONNECTION_STRING, POSTGRES_URI } from '../globals';
import {
  CheckpointTable,
  DB_MONITORING_TABLE,
  LyxPriceTable,
  OperatorCheckpoint,
  OperatorTable,
  ProtocolCheckpoint,
  RewardsBalance,
  ValidatorTable,
} from './types';
import { LoggerService } from '../logger/logger.service';
import { DebugLogger } from '../decorators/debug-logging.decorator';
import { VALIDATOR_STATUS } from '../types/enums';

const TRANSFER_EVENT_NAME = 'Transfer';

@Injectable()
export class DbClientService {
  protected readonly indexingClient: Pool & {
    query: (query: string, values?: any[]) => Promise<QueryResult<any>>;
  };
  protected readonly monitoringClient: Pool & {
    query: (query: string, values?: any[]) => Promise<QueryResult<any>>;
  };
  protected readonly logger: winston.Logger;

  constructor(protected readonly loggerService: LoggerService) {
    this.logger = loggerService.getChildLogger('DbClientService');
    this.indexingClient = new Pool({
      connectionString: INDEXING_CONNECTION_STRING,
    });
    this.monitoringClient = new Pool({
      connectionString: POSTGRES_URI,
    });
  }

  public async fetchNumberOfStakers(): Promise<number> {
    const res = await this.executeQuery<{ count: string }>(
      `
      SELECT COUNT(DISTINCT to_value) AS count 
      FROM (
        SELECT 
            MAX(CASE WHEN ep.name = 'to' THEN ep.value END) AS to_value
          FROM event e 
          JOIN event_parameter ep ON e.id = ep."eventId"
          WHERE e.address = $1 
              AND e."eventName" = $2
          GROUP BY  e.id, e."blockNumber", e.date, e."transactionHash"
      ) AS subquery;
    `,
      [CONTRACT_SLYX, TRANSFER_EVENT_NAME],
    );
    return parseInt(res[0].count);
  }

  public async fetchStakersList(): Promise<string[]> {
    const res = await this.executeQuery<{ address: string }>(
      `
      SELECT DISTINCT to_value AS address 
      FROM (
        SELECT 
            MAX(CASE WHEN ep.name = 'to' THEN ep.value END) AS to_value
          FROM event e 
          JOIN event_parameter ep ON e.id = ep."eventId"
          WHERE e.address = $1 
              AND e."eventName" = $2
          GROUP BY  e.id, e."blockNumber", e.date, e."transactionHash"
      ) AS subquery;
    `,
      [CONTRACT_SLYX, TRANSFER_EVENT_NAME],
    );
    return res.map((row) => row.address);
  }

  public async fetchLastMonitoredBlock(): Promise<number> {
    const getMaxBlockNumberQuery = `SELECT MAX("blockNumber") FROM ${DB_MONITORING_TABLE.REWARDS_BALANCE}`;
    const res = await this.executeQueryMonitoring<{ max: number }>(getMaxBlockNumberQuery);
    if (res.length === 0 || !res[0].max) return 0;
    else return res[0].max;
  }

  public async fetchRewardBalancesAtBlock(blockNumber: number): Promise<RewardsBalance[]> {
    return await this.executeQueryMonitoring<RewardsBalance>(
      `
      SELECT * FROM ${DB_MONITORING_TABLE.REWARDS_BALANCE} WHERE "blockNumber" = $1;
    `,
      [blockNumber],
    );
  }

  public async insertLyxPriceTable(row: LyxPriceTable): Promise<void> {
    const query = `
      INSERT INTO ${DB_MONITORING_TABLE.LYX_PRICE}
        ("blockNumber", "usd", "eur", "jpy", "gbp", "aud", "cad", "chf", "cny", "hkd", "inr")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT ("blockNumber") DO NOTHING;
    `;

    try {
      await this.executeQueryMonitoring(query, [
        row.blockNumber,
        row.usd,
        row.eur,
        row.jpy,
        row.gbp,
        row.aud,
        row.cad,
        row.chf,
        row.cny,
        row.hkd,
        row.inr,
      ]);
    } catch (error) {
      this.logger.error(`Error inserting lyx price table: ${error.message}`);
      throw error;
    }
  }

  public async batchInsertRewardsBalance(rows: RewardsBalance[]): Promise<void> {
    if (rows.length === 0) return;

    // Start the placeholders with an empty array.
    const placeholders: string[] = [];
    const values: any[] = [];

    // Build the placeholders array and values array.
    rows.forEach((row, index) => {
      const baseIndex = index * 7;
      placeholders.push(
        `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${
          baseIndex + 5
        }, $${baseIndex + 6}, $${baseIndex + 7})`,
      );
      values.push(
        row.address,
        row.blockNumber,
        row.blockDate,
        row.currentBalance,
        row.balanceChange,
        row.totalRewards,
        row.balanceSLyx,
      );
    });

    const query = `
    INSERT INTO ${DB_MONITORING_TABLE.REWARDS_BALANCE}
      ("address", "blockNumber", "blockDate", "currentBalance", "balanceChange", "totalRewards", "balanceSLyx")
    VALUES ${placeholders.join(', ')}
    ON CONFLICT ("address", "blockNumber") DO NOTHING;
  `;

    try {
      await this.executeQueryMonitoring(query, values);
    } catch (error) {
      this.logger.error(`Error batch inserting rewards balance: ${error.message}`);
      throw error;
    }
  }

  public async fetchLyxPrices(): Promise<LyxPriceTable[]> {
    return await this.executeQueryMonitoring<LyxPriceTable>(`
      SELECT * FROM ${DB_MONITORING_TABLE.LYX_PRICE}
    `);
  }

  public async fetchRewardsBalances(address: string): Promise<RewardsBalance[]> {
    return await this.executeQueryMonitoring<RewardsBalance>(
      `
        SELECT * FROM ${DB_MONITORING_TABLE.REWARDS_BALANCE} WHERE "address" = $1 ORDER BY "blockNumber" DESC;
      `,
      [address],
    );
  }

  public async insertProtocolCheckpoint(data: ProtocolCheckpoint): Promise<void> {
    const query = `
    INSERT INTO ${DB_MONITORING_TABLE.PROTOCOL_CHECKPOINT}
      ("blockNumber", "totalStaked", "totalRewards", "totalFeesCollected", "totalSLyx", "totalUnstaked", "activatedValidators", "exitedValidators", "pendingValidators", "aprOnSLyx", "aprOnActivated", "lpSLyx", "lpLyx", "stakers", "totalValidators")
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
  `;
    const values = [
      data.blockNumber,
      data.totalStaked,
      data.totalRewards,
      data.totalFeesCollected,
      data.totalSLyx,
      data.totalUnstaked,
      data.activatedValidators,
      data.exitedValidators,
      data.pendingValidators,
      data.aprOnSLyx,
      data.aprOnActivated,
      data.lpSLyx,
      data.lpLyx,
      data.stakers,
      data.totalValidators,
    ];

    try {
      await this.executeQueryMonitoring(query, values);
    } catch (error) {
      this.logger.error(`Error inserting protocol checkpoint: ${error.message}`);
      throw error;
    }
  }

  @DebugLogger()
  public async insertOperator(address: string, merkleRoot: string): Promise<void> {
    await this.monitoringClient.query(
      `INSERT INTO ${DB_MONITORING_TABLE.OPERATOR} (address, "merkleRoot") VALUES ($1, $2)`,
      [address, merkleRoot],
    );
  }

  @DebugLogger()
  public async getOperator(address: string): Promise<OperatorTable | null> {
    const result = await this.monitoringClient.query(
      `SELECT * FROM ${DB_MONITORING_TABLE.OPERATOR} WHERE address = $1`,
      [address],
    );
    if (result.rowCount === 0) return null;
    return result.rows[0] as OperatorTable;
  }

  @DebugLogger()
  public async getOperators(): Promise<OperatorTable[]> {
    const res = await this.monitoringClient.query(`SELECT * FROM ${DB_MONITORING_TABLE.OPERATOR}`);
    return res.rows as OperatorTable[];
  }

  @DebugLogger()
  public async updateOperator(address: string, merkleRoot: string): Promise<void> {
    await this.monitoringClient.query(
      `UPDATE ${DB_MONITORING_TABLE.OPERATOR} SET "merkleRoot" = $1 WHERE address = $2`,
      [merkleRoot, address],
    );
  }

  public async insertValidator(validator: ValidatorTable): Promise<void> {
    await this.monitoringClient.query(
      `INSERT INTO ${DB_MONITORING_TABLE.VALIDATOR} ("publicKey", operator, status) 
        VALUES ($1, $2, $3)`,
      [validator.publicKey, validator.operator, validator.status],
    );
  }

  @DebugLogger()
  public async getValidator(publicKey: string): Promise<ValidatorTable | null> {
    const result = await this.monitoringClient.query(
      `SELECT * FROM ${DB_MONITORING_TABLE.VALIDATOR} WHERE "publicKey" = $1`,
      [publicKey],
    );
    if (result.rowCount === 0) return null;
    return result.rows[0] as ValidatorTable;
  }

  public async updateValidator(publicKey: string, status: VALIDATOR_STATUS): Promise<void> {
    await this.monitoringClient.query(
      `UPDATE ${DB_MONITORING_TABLE.VALIDATOR} SET status = $1 WHERE "publicKey" = $2`,
      [status, publicKey],
    );
  }

  @DebugLogger()
  public async countEffectiveValidatorsPerOperator(): Promise<
    { operator: string; count: number }[]
  > {
    const result = await this.monitoringClient.query(
      `
      SELECT operator, COUNT(*) FROM ${DB_MONITORING_TABLE.VALIDATOR}
      WHERE status = '${VALIDATOR_STATUS.ACTIVE_ONGOING}'
      OR status = '${VALIDATOR_STATUS.ACTIVE}'
      OR status = '${VALIDATOR_STATUS.ACTIVE_EXITING}'
      GROUP BY operator;
      `,
    );
    return result.rows as { operator: string; count: number }[];
  }

  @DebugLogger()
  public async countPendingValidatorsPerOperator(): Promise<{ operator: string; count: number }[]> {
    const result = await this.monitoringClient.query(
      `
      SELECT operator, COUNT(*) FROM ${DB_MONITORING_TABLE.VALIDATOR}
      WHERE status = '${VALIDATOR_STATUS.PENDING}'
      OR status = '${VALIDATOR_STATUS.PENDING_INITIALIZED}'
      OR status = '${VALIDATOR_STATUS.PENDING_QUEUED}'
      GROUP BY operator;
      `,
    );
    return result.rows as { operator: string; count: number }[];
  }

  @DebugLogger()
  public async countExitedValidatorsPerOperator(): Promise<{ operator: string; count: number }[]> {
    const result = await this.monitoringClient.query(
      `
      SELECT operator, COUNT(*) FROM ${DB_MONITORING_TABLE.VALIDATOR}
      WHERE status = '${VALIDATOR_STATUS.EXITED}'
      OR status = '${VALIDATOR_STATUS.EXITED_SLASHED}'
      OR status = '${VALIDATOR_STATUS.EXITED_UNSLASHED}'
      OR status = '${VALIDATOR_STATUS.WITHDRAWAL}'
      OR status = '${VALIDATOR_STATUS.WITHDRAWAL_POSSIBLE}'
      OR status = '${VALIDATOR_STATUS.WITHDRAWAL_DONE}'
      GROUP BY operator;
      `,
    );
    return result.rows as { operator: string; count: number }[];
  }

  @DebugLogger()
  public async insertCheckpoint(validatorsCheckpointBlock: number): Promise<void> {
    await this.monitoringClient.query(
      `INSERT INTO ${DB_MONITORING_TABLE.CHECKPOINT} ("validatorsCheckpointBlock") VALUES ($1)`,
      [validatorsCheckpointBlock],
    );
  }

  @DebugLogger()
  public async getCheckpoint(): Promise<CheckpointTable> {
    const result = await this.monitoringClient.query(
      `SELECT * FROM ${DB_MONITORING_TABLE.CHECKPOINT}`,
    );
    if (result.rowCount && result.rowCount > 0) return result.rows[0];
    await this.insertCheckpoint(0);
    return {
      validatorsCheckpointBlock: 0,
    };
  }

  @DebugLogger()
  public async updateValidatorsCheckpoint(validatorsCheckpointBlock: number): Promise<void> {
    await this.monitoringClient.query(
      `UPDATE ${DB_MONITORING_TABLE.CHECKPOINT} SET "validatorsCheckpointBlock" = $1`,
      [validatorsCheckpointBlock],
    );
  }

  @DebugLogger()
  public async insertOperatorCheckpoint(
    blockNumber: number,
    operator: string,
    activeValidators: number,
    pendingValidators: number,
    exitedValidators: number,
  ): Promise<void> {
    await this.monitoringClient.query(
      `INSERT INTO ${DB_MONITORING_TABLE.OPERATOR_CHECKPOINT}
        ("blockNumber", operator, "activeValidators", "pendingValidators", "exitedValidators")
      VALUES ($1, $2, $3, $4, $5)
    `,
      [blockNumber, operator, activeValidators, pendingValidators, exitedValidators],
    );
  }

  @DebugLogger()
  public async fetchLastOperatorCheckpointPerOperator(): Promise<OperatorCheckpoint[]> {
    try {
      const result = await this.monitoringClient.query(`
      SELECT DISTINCT ON (operator) *
      FROM ${DB_MONITORING_TABLE.OPERATOR_CHECKPOINT}
      ORDER BY operator, "blockNumber" DESC;
    `);
      return result.rows as OperatorCheckpoint[];
    } catch (error) {
      this.logger.error(
        `Error fetching the last operator checkpoint per operator: ${error.message}`,
      );
      throw error;
    }
  }

  @DebugLogger()
  protected async executeQuery<T>(query: string, values?: any[]): Promise<T[]> {
    try {
      const result = await this.indexingClient.query(query, values);
      return result.rows as T[];
    } catch (error) {
      throw new Error(`Error executing query: ${query}\n\nError details: ${error.message}`);
    }
  }

  protected async executeQueryMonitoring<T>(query: string, values?: any[]): Promise<T[]> {
    try {
      const result = await this.monitoringClient.query(query, values);
      return result.rows as T[];
    } catch (error) {
      throw new Error(`Error executing query: ${query}\n\nError details: ${error.message}`);
    }
  }
}
