export interface MerkleRootUpdatedEvent extends AnyEvent {
  args: {
    sender: string;
    merkleRoot: string;
    merkleProofs: string; // IPFS link containing the merkle proofs and allocations
  };
}
export interface RewardsUpdatedEvent extends AnyEvent {
  args: {
    periodRewards: string;
    totalRewards: string;
    feesCollected: string;
    rewardPerToken: string;
    distributorReward: string;
    protocolReward: string;
  };
}

export interface RewardsVoteSubmitted extends AnyEvent {
  args: {
    sender: string;
    totalRewards: string;
    activatedValidators: string;
    exitedValidators: string;
  };
}

export interface OperatorAddedEvent extends AnyEvent {
  args: {
    operator: string;
    depositDataMerkleRoot: string;
    depositDataMerkleProofs: string; // IPFS link containing the merkle proofs and allocations
  };
}

export interface AnyEvent {
  event: string;
  blockNumber: number;
}
