/**
 * Interface for MerkleResponse object.
 *
 * @interface
 * @property {MerkleDistributions} distribution - Object that contains the merkle distribution.
 * @property {string} merkleRoot - A root hash value.
 * @property {number} blockNumber - The block number in which the distribution occurs.
 */
export interface MerkleResponse {
  distribution: MerkleDistributions;
  merkleRoot: string;
  blockNumber: number;
}

export interface MerkleDistributions {
  [key: string]: MerkleDistribution;
}

export interface MerkleDistribution {
  index: number;
  proof: string[];
  tokens: string[];
  values: string[];
}
