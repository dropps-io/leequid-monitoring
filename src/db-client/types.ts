export enum DB_MONITORING_TABLE {
  REWARDS_BALANCE = 'rewards_balance',
  LYX_PRICE = 'lyx_price',
  PROTOCOL_CHECKPOINT = 'protocol_checkpoint',
}

export interface RewardsBalance {
  address: string;
  blockNumber: number;
  blockDate: Date;
  currentBalance: string;
  balanceChange: string;
  totalRewards: string;
  balanceSLyx: string;
}

export interface ProtocolCheckpoint {
  date: Date;
  blockNumber: number;
  totalStaked: string;
  totalRewards: string;
  totalFeesCollected: string;
  totalSLyx: string;
  totalUnstaked: string;
  activatedValidators: number;
  exitedValidators: number;
  pendingValidators: number;
  aprOnSLyx: string;
  aprOnActivated: string;
  lpSLyx: string;
  lpLyx: string;
  stakers: number;
  totalValidators: number;
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
