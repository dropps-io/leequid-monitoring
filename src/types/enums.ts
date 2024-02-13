export enum VALIDATOR_STATUS {
  PENDING_INITIALIZED = 'pending_initialized',
  PENDING = 'pending',
  PENDING_QUEUED = 'pending_queued',
  ACTIVE_ONGOING = 'active_ongoing',
  ACTIVE = 'active',
  ACTIVE_EXITING = 'active_exiting',
  ACTIVE_SLASHED = 'active_slashed',
  EXITED_UNSLASHED = 'exited_unslashed',
  EXITED_SLASHED = 'exited_slashed',
  WITHDRAWAL_POSSIBLE = 'withdrawal_possible',
  WITHDRAWAL_DONE = 'withdrawal_done',
  WITHDRAWAL = 'withdrawal',
  EXITED = 'exited',
  NON_REGISTERED = 'non_registered',
  REGISTERED = 'registered',
}

export enum OPERATOR_SLUG {
  '0x6aa0757bc4ffdC9f0DEB5E9fA08173c07EF2afCc' = 'stakelab',
  '0x6D975E3F0C15DB1BbF987DA6aC244aBb9fAA6163' = 'leequid',
  '0xD692Ba892a902810a2EE3fA41C1D8DcD652D47Ab' = 'leequid-testnet',
}
