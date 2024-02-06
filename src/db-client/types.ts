import { VALIDATOR_STATUS } from '../types/enums';

export enum DB_MONITORING_TABLE {
  VALIDATOR = 'validator',
  OPERATOR = 'operator',
  REWARDS_BALANCE = 'rewards_balance',
  LYX_PRICE = 'lyx_price',
  PROTOCOL_CHECKPOINT = 'protocol_checkpoint',
  OPERATOR_CHECKPOINT = 'operator_checkpoint',
  CHECKPOINT = 'checkpoint',
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

export interface OperatorCheckpoint {
  date: Date;
  blockNumber: number;
  operator: string;
  activeValidators: number;
  pendingValidators: number;
  exitedValidators: number;
}

export interface ValidatorTable {
  publicKey: string;
  operator: string;
  status: VALIDATOR_STATUS;
}

export interface OperatorTable {
  address: string;
  merkleRoot: string;
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

export interface CheckpointTable {
  validatorsCheckpointBlock: number;
}
