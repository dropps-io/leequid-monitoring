import { IPFS_GATEWAYS } from '../globals';

export const formatUrl = (url: string, ipfsGateway = IPFS_GATEWAYS[0]): string => {
  if (!url) return url;
  else if (url.includes('ipfs://')) return url.replace('ipfs://', ipfsGateway);
  else if (url.includes('/ipfs/')) return url.replace('/ipfs/', ipfsGateway);
  else return url;
};
