import { Injectable } from '@nestjs/common';
import { Pool, QueryResult } from 'pg';
import winston from 'winston';

import { CONTRACT_SLYX, INDEXING_CONNECTION_STRING, POSTGRES_URI } from '../globals';
import { DB_MONITORING_TABLE, LyxPriceTable, RewardsBalance } from './types';
import { LoggerService } from '../logger/logger.service';

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
