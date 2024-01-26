import { ApiProperty } from '@nestjs/swagger';

export class PoolContractStateDto {
  @ApiProperty({
    name: 'contractBalance',
    description: 'The balance of the contract, in wei',
    example: '1000000000000000000',
    required: true,
  })
  readonly contractBalance: string;

  @ApiProperty({
    name: 'activatedValidators',
    description: 'The total number of activated validators (not deducting exited ones)',
    example: 10000000,
    required: true,
  })
  readonly activatedValidators: number;

  @ApiProperty({
    name: 'exitedValidators',
    description: 'The total number of exited validators',
    example: 10000000,
    required: true,
  })
  readonly exitedValidators: number;

  @ApiProperty({
    name: 'pendingValidators',
    description: 'The total number of pending validators',
    example: 10000000,
    required: true,
  })
  readonly pendingValidators: number;

  @ApiProperty({
    name: 'minActivatingDeposit',
    description: 'The minimum stake amount to trigger activation mechanism, in wei',
    example: '10000000000000000',
    required: true,
  })
  readonly minActivatingDeposit: string;

  @ApiProperty({
    name: 'pendingValidatorsLimit',
    description: 'The pending validators limit, in percentage',
    example: 10, // 10%
    required: true,
  })
  readonly pendingValidatorsLimit: number;
}
