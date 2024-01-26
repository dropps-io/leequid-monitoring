import { ApiProperty } from '@nestjs/swagger';

export class OracleCheckUnstakeDto {
  @ApiProperty({
    name: 'unstakeRequired',
    description: 'Whether we need to start the unstake process',
    example: true,
    required: true,
  })
  readonly unstakeRequired: boolean;

  @ApiProperty({
    name: 'validatorsToUnstake',
    description: 'The amount of validators to unstake',
    example: 3,
    required: true,
  })
  readonly validatorsToUnstake: number;

  @ApiProperty({
    name: 'signature',
    description: 'Signature of the oracle',
    example: '0x1234567890...',
    required: true,
  })
  readonly signature: string;
}
