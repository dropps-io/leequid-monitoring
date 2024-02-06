import { VALIDATOR_STATUS } from './enums';

export interface ValidatorResponse {
  index: string;
  balance: string;
  status: VALIDATOR_STATUS;
  validator: {
    pubkey: string;
    withdrawal_credentials: string;
    effective_balance: string;
    slashed: boolean;
    activation_eligibility_epoch: string;
    activation_epoch: string;
    exit_epoch: string;
    withdrawable_epoch: string;
  };
}
