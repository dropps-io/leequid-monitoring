export enum DB_MONITORING_TABLE {
  REWARDS_BALANCE = 'rewards_balance',
  LYX_PRICE = 'lyx_price',
}

export interface RewardsBalance {
  address: string;
  blockNumber: number;
  blockDate: Date;
  currentBalance: string;
  balanceChange: string;
  totalRewards: string;
}

export interface LyxPriceTable {
  blockNumber: number;
  usd: number;
  eur: number;
  jpy: number;
  gbp: number;
  aud: number;
  cad: number;
  chf: number;
  cny: number;
  hkd: number;
  inr: number;
}
