import { getConfigOrThrow, getEnv, getEnvOrThrow } from './utils/get-or-throw';

export const RPC_URL = getEnv<string>('RPC_URL');
export const BEACON_API_URL = getEnv<string>('BEACON_API_URL');

export const ORCHESTRATOR_KEY_ADDRESS: string = getEnvOrThrow('ORCHESTRATOR_KEY_ADDRESS');
export const CONTRACT_REWARDS: string = getEnvOrThrow<string>('CONTRACT_REWARDS');
export const CONTRACT_SLYX = getEnvOrThrow<string>('CONTRACT_SLYX');
export const CONTRACT_POOL = getEnvOrThrow<string>('CONTRACT_POOL');
export const CONTRACT_POOL_VALIDATORS = getEnvOrThrow<string>('CONTRACT_POOL_VALIDATORS');
export const CONTRACT_ORACLES = getEnvOrThrow<string>('CONTRACT_ORACLES');
export const LIQUIDITY_POOLS = (getEnv<string>('LIQUIDITY_POOLS') || '').split(',');
export const CONTRACT_MERKLE_DISTRIBUTOR = getEnvOrThrow<string>('CONTRACT_MERKLE_DISTRIBUTOR');

export const WITHDRAWAL_CREDENTIALS =
  '0x010000000000000000000000' + CONTRACT_REWARDS.slice(2).toLowerCase();

export const P_LIMIT = getConfigOrThrow<number>('p_limit');

export const INDEXING_CONNECTION_STRING = getEnvOrThrow<string>('INDEXING_CONNECTION_STRING');

export const PORT = getEnvOrThrow<number>('PORT', 3020);
export const DEPLOY_ENV = getEnvOrThrow<string>('DEPLOY_ENV', 'dev');
export const MONITORING_CRON = getConfigOrThrow<string>('cron_checks');
export const CRON_PROTOCOL_CHECKPOINT = getConfigOrThrow<string>('cron_protocol_checkpoint');

export const OPERATOR_LEEQUID_ADR = getEnvOrThrow<string>('OPERATOR_LEEQUID_ADR');
export const OPERATOR_STAKELAB_ADR = getEnvOrThrow<string>('OPERATOR_STAKELAB_ADR');

export const CONSENSUS_API_URL = getEnvOrThrow('CONSENSUS_API_URL');
export const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';
export const COINGECKO_LYX_ID = 'lukso-token-2';

const dbUser = getEnvOrThrow<string>('POSTGRES_USER', 'postgres');
const dbPassword = getEnvOrThrow<string>('POSTGRES_PASSWORD', 'postgres');
const dbHost = getEnvOrThrow<string>('POSTGRES_HOST', 'localhost');
const dbName = getEnvOrThrow<string>('POSTGRES_DB', 'indexing');
const dbUri = `postgresql://${dbUser}:${dbPassword}@${dbHost}/${dbName}`;
export const POSTGRES_URI = getEnvOrThrow<string>('POSTGRES_URI', dbUri);

const ipfsGateways = getEnv<string>('IPFS_GATEWAYS');
const ipfsGatewayHosts = getEnv<string>('IPFS_GATEWAY_HOSTS');
if (!ipfsGateways && !ipfsGatewayHosts)
  throw new Error(`Missing env var IPFS_GATEWAYS or IPFS_GATEWAY_HOSTS`);

export const IPFS_GATEWAYS = ipfsGateways
  ? ipfsGateways.split(',')
  : (ipfsGatewayHosts || '').split(',').map((e) => `https://${e}/ipfs/`);
