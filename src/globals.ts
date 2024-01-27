import { getConfigOrThrow, getEnv, getEnvOrThrow } from './utils/get-or-throw';

const ARCHIVE_NODE_HOSTS = (getEnv<string>('ARCHIVE_NODE_HOSTS') || '').split(',');

if (ARCHIVE_NODE_HOSTS.length === 0 && !getEnv<string>('RPC_URL'))
  throw new Error('Missing env var ARCHIVE_NODE_HOSTS or RPC_URL');

export const RPC_URL = getEnv<string>('RPC_URL') || `http://${ARCHIVE_NODE_HOSTS[0]}:8545`;

export const ORCHESTRATOR_KEY_ADDRESS: string = getEnvOrThrow('ORCHESTRATOR_KEY_ADDRESS');
export const CONTRACT_REWARDS: string = getEnvOrThrow<string>('CONTRACT_REWARDS');
export const CONTRACT_SLYX = getEnvOrThrow<string>('CONTRACT_SLYX');
export const CONTRACT_POOL = getEnvOrThrow<string>('CONTRACT_POOL');
export const LIQUIDITY_POOLS = (getEnv<string>('LIQUIDITY_POOLS') || '').split(',');
export const CONTRACT_MERKLE_DISTRIBUTOR = getEnvOrThrow<string>('CONTRACT_MERKLE_DISTRIBUTOR');

export const INDEXING_CONNECTION_STRING = getEnvOrThrow<string>('INDEXING_CONNECTION_STRING');

export const PORT = getEnvOrThrow<number>('PORT', 3020);
export const DEPLOY_ENV = getEnvOrThrow<string>('DEPLOY_ENV', 'dev');
export const MONITORING_CRON = getConfigOrThrow<string>('cron_checks');

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
