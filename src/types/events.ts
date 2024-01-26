export interface CashoutEvent extends AnyEvent {
  args: {
    account: string;
    amount: bigint;
  };
}

interface AnyEvent {
  event: string;
  eventName: string;
  blockNumber: number;
}
