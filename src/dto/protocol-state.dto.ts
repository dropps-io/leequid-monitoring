import { ApiProperty } from '@nestjs/swagger';

export class ProtocolStateDto {
  @ApiProperty({
    name: 'orchestratorKeyBalance',
    description: 'The balance, in wei, of the orchestrator key',
    example: '12000000000000000000000',
    required: true,
  })
  readonly orchestratorKeyBalance: string;

  @ApiProperty({
    name: 'sLYXSupply',
    description: 'The total amount of sLYX, in WEI',
    example: '120000000000000000000000000000000',
    required: true,
  })
  readonly sLYXSupply: string;

  @ApiProperty({
    name: 'totalStakers',
    description: 'Total amount of individual staker',
    example: 2345,
    required: true,
  })
  readonly totalStakers: number;

  @ApiProperty({
    name: 'totalRewards',
    description: 'The total rewards amount, in WEI',
    example: '1200000000000000000000000',
    required: true,
  })
  readonly totalRewards: string;

  @ApiProperty({
    name: 'poolBalance',
    description: 'The balance of the Pool contract, in WEI',
    example: '1200000000000000000000000',
    required: true,
  })
  readonly poolBalance: string;
}
