import { config } from 'dotenv';
import path from 'path';
import pg from 'pg';

import { POSTGRES_URI } from '../globals';
import { DB_MONITORING_TABLE } from './types';
import { fillHistoricalLyxPrice } from './tmp/fill-historical-lyx-price';

if (process.env.NODE_ENV === 'test') config({ path: path.resolve(process.cwd(), '.env.test') });

config();

const dbName = POSTGRES_URI.split('/').pop();
const defaultConnectionString = POSTGRES_URI.replace(`/${dbName}`, '');

let client = new pg.Client({ connectionString: defaultConnectionString });

export const seedMonitoring = async (dropTables?: boolean): Promise<void> => {
  await client.connect();

  // Check if the target database exists
  const dbExistsResult = await client.query(`
    SELECT 1 FROM pg_database WHERE datname='${dbName}'
  `);
  if (dbExistsResult.rowCount === 0) {
    await client.query(`CREATE DATABASE "${dbName}"`);
  }

  await client.end();

  client = new pg.Client({ connectionString: POSTGRES_URI });

  await client.connect();

  if (dropTables) {
    for (const table of Object.keys(DB_MONITORING_TABLE).values())
      await client.query(`DROP TABLE IF EXISTS ${DB_MONITORING_TABLE[table]} CASCADE`);
  }

  // Create Operator table
  await client.query(`
    CREATE TABLE IF NOT EXISTS ${DB_MONITORING_TABLE.REWARDS_BALANCE} (
      "address" CHAR(42) COLLATE pg_catalog."default" NOT NULL,
      "blockNumber" INT NOT NULL,
      "blockDate" TIMESTAMPTZ NOT NULL,
      "currentBalance" VARCHAR(26) NOT NULL,
      "balanceChange" VARCHAR(26) NOT NULL,
      "totalRewards" VARCHAR(26) NOT NULL,
      "balanceSLyx" VARCHAR(26),
      UNIQUE ("address", "blockNumber")
    )
  `);

  // Create Validator table
  await client.query(`
    CREATE TABLE IF NOT EXISTS ${DB_MONITORING_TABLE.LYX_PRICE} (
      "blockNumber" INT NOT NULL PRIMARY KEY,
      "date" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "usd" NUMERIC NOT NULL,
      "eur" NUMERIC NOT NULL,
      "jpy" NUMERIC NOT NULL,
      "gbp" NUMERIC NOT NULL,
      "aud" NUMERIC NOT NULL,
      "cad" NUMERIC NOT NULL,
      "chf" NUMERIC NOT NULL,
      "cny" NUMERIC NOT NULL,
      "hkd" NUMERIC NOT NULL,
      "inr" NUMERIC NOT NULL
    )
  `);

  // Apply patch to add missing columns

  await client.query(`
    ALTER TABLE ${DB_MONITORING_TABLE.LYX_PRICE}
    ALTER COLUMN "date" SET DEFAULT NOW();
  `);

  // END OF PATCH

  await client.query(`
    CREATE TABLE IF NOT EXISTS ${DB_MONITORING_TABLE.PROTOCOL_CHECKPOINT} (
      "blockNumber" INT NOT NULL PRIMARY KEY,
      "date" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "totalStaked" VARCHAR(26) NOT NULL,
      "totalRewards" VARCHAR(26) NOT NULL,
      "totalFeesCollected" VARCHAR(26) NOT NULL,
      "totalSLyx" VARCHAR(26) NOT NULL,
      "totalUnstaked" VARCHAR(26) NOT NULL,
      "activatedValidators" INT NOT NULL,
      "exitedValidators" INT NOT NULL,
      "pendingValidators" INT NOT NULL,
      "aprOnSLyx" VARCHAR(26) NOT NULL,
      "aprOnActivated" VARCHAR(26) NOT NULL,
      "lpSLyx" VARCHAR(26) NOT NULL,
      "lpLyx" VARCHAR(26) NOT NULL,
      "stakers" INT NOT NULL,
      "totalValidators" INT NOT NULL
    )
  `);

  // Create Operator table
  await client.query(`
    CREATE TABLE IF NOT EXISTS ${DB_MONITORING_TABLE.OPERATOR} (
      "address" CHAR(42) PRIMARY KEY,
      "merkleRoot" CHAR(66) NOT NULL
    )
  `);

  // Create Validator table
  await client.query(`
    CREATE TABLE IF NOT EXISTS ${DB_MONITORING_TABLE.VALIDATOR} (
      "publicKey" CHAR(98) PRIMARY KEY,
      "operator" CHAR(42) NOT NULL REFERENCES ${DB_MONITORING_TABLE.OPERATOR}("address"),
      "status" VARCHAR(64) NOT NULL
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS ${DB_MONITORING_TABLE.OPERATOR_CHECKPOINT} (
      "blockNumber" INT NOT NULL,
      "date" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "operator" CHAR(42) NOT NULL REFERENCES ${DB_MONITORING_TABLE.OPERATOR}("address"),
      "activeValidators" INT NOT NULL,
      "pendingValidators" INT NOT NULL,
      "exitedValidators" INT NOT NULL,
      UNIQUE ("blockNumber", "operator")
    )
  `);

  // Create Checkpoint table
  await client.query(`
    CREATE TABLE IF NOT EXISTS ${DB_MONITORING_TABLE.CHECKPOINT} (
      "validatorsCheckpointBlock" INT NOT NULL
    )
  `);

  await client.end();
  // eslint-disable-next-line no-console
  console.log('monitoring seed script successfully executed');
};
