import pg from 'pg';
import { Block, JsonRpcProvider } from 'ethers';
import axios from 'axios';

import { DB_MONITORING_TABLE, LyxPriceTable } from '../types';
import { RPC_URL } from '../../globals';
import { SUPPORTED_CURRENCY } from '../../rewards-tracking/types';

const provider = new JsonRpcProvider(RPC_URL);

const genesisTimestamp = RPC_URL?.includes('testnet') ? 1683128400 : 1684858800;

async function getBlockForTimestamp(
  targetTimestamp: number,
  currentBlockNumber: number,
  currentBlock: Block,
): Promise<number> {
  const currentBlockTimestamp = currentBlock.timestamp;

  // Calculate the total time elapsed since the blockchain started
  const timeElapsed = currentBlockTimestamp - genesisTimestamp;
  // Calculate the average block time
  const averageBlockTime = timeElapsed / currentBlockNumber;

  // Estimate the target block number based on the target timestamp
  const targetBlockEstimate = Math.round((targetTimestamp - genesisTimestamp) / averageBlockTime);

  console.log(`Target block estimate for timestamp ${targetTimestamp}: ${targetBlockEstimate}`);

  return targetBlockEstimate;
}

export const fillHistoricalLyxPrice = async (client: pg.Client): Promise<void> => {
  const res = await client.query<LyxPriceTable>(`
    SELECT * FROM ${DB_MONITORING_TABLE.LYX_PRICE} WHERE "date" IS NULL
  `);

  for (const row of res.rows) {
    const block = await provider.getBlock(row.blockNumber);
    if (!block) throw new Error(`Block ${row.blockNumber} not found`);
    const date = new Date(block.timestamp * 1000);
    await client.query(
      `
      UPDATE ${DB_MONITORING_TABLE.LYX_PRICE} SET "date" = $1 WHERE "blockNumber" = $2
    `,
      [date, row.blockNumber],
    );
  }

  const res2 = await client.query(
    `
  SELECT * FROM ${DB_MONITORING_TABLE.LYX_PRICE} WHERE "blockNumber" < $1
  `,
    [1600000],
  );

  if (res2.rows.length > 0) return;

  const toInsert: Partial<LyxPriceTable & { timestamp: number }>[] = [];

  // else
  for (const currency of Object.values(SUPPORTED_CURRENCY)) {
    const response = await axios.get<{
      prices: [number, number][]; // [timestamp, price]
    }>(
      `https://api.coingecko.com/api/v3/coins/lukso-token-2/market_chart/range?vs_currency=${currency}&from=1696901387&to=1707431025`,
    );

    const currentBlockNumber = await provider.getBlockNumber();
    // Get the current block to find its timestamp
    const currentBlock = await provider.getBlock(currentBlockNumber);
    if (!currentBlock) throw new Error(`Block ${currentBlockNumber} not found`);

    for (const [timestamp, price] of response.data.prices) {
      const index = toInsert.findIndex((e) => e.timestamp === timestamp);

      if (index === -1) {
        toInsert.push({
          blockNumber: await getBlockForTimestamp(
            timestamp / 1000,
            currentBlockNumber,
            currentBlock,
          ),
          timestamp,
          date: new Date(timestamp),
          usd: price,
        });
      } else {
        toInsert[index][currency] = price;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 1000 * 30));
  }

  console.log(toInsert);

  for (const row of toInsert) {
    await client.query(
      `
      INSERT INTO ${DB_MONITORING_TABLE.LYX_PRICE}
       ("blockNumber", "date", "usd", "eur", "jpy", "gbp", "aud", "cad", "chf", "cny", "hkd", "inr")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `,
      [
        row.blockNumber,
        row.date,
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
      ],
    );
  }
};
