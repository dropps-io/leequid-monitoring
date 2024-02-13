export interface StakingRewards {
  name: string; // The name of your protocol.
  totalUsers: number; // Total number of individual wallets holding the LST.
  totalBalanceUsd: number; // The total balance held in USD.
  supportedAssets: // Array of liquid staking token(s) your service supports.
  {
    symbol: string; // The symbol of the LST.
    slug: string; // The LST slug (Coingecko ID or learn more below).
    baseSlug: string; // The slug of the base asset.
    supply: number; // The total token supply of the LST.
    apr: number; // Annual percentage rate for staking on this chain.
    fee: number; // Fee percentage for staking services.
    users: number; // Number of individual wallets holding the LST.
    unstakingTime: number; // Time in seconds to unbond - not exchanging!
    exchangeRatio: number; // Ratio of the base asset to LST.
    validators: number; // (Optional) Number of validators.
    nodeOperators: number; // (Optional) Number of node operators.
    nodeOperatorBreakdown: // (Optional) Array of Node operators.
    {
      operatorSlug: string; // the slug of the provider, more info below.
      balance: number; // token balance of the base asset validated by this operator.
      fee: number; // Fee percentage the operator gets.
      validators: number; // (Optional) Number of validators this operator runs for you.
      validatorBreakdown: // (Optional) Array of Addresses for this operator.
      {
        address: string; // validator address
        balance: number; // validator token balance
      }[];
    }[];
  }[];
}
