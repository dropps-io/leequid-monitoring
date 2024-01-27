import { ApiProperty } from '@nestjs/swagger';

import { DepositDataProofDto } from './deposit-data.dto';

export class OracleRegisterValidatorsDto {
  @ApiProperty({
    name: 'depositRoot',
    description: 'Deposit root fetched from the beacon deposit contract',
    example: '0x1234567890...',
    required: true,
  })
  readonly depositRoot: string;

  @ApiProperty({
    name: 'depositData',
    description: 'Deposit data to register',
    example: [],
    required: true,
  })
  readonly depositData: DepositDataProofDto[];

  @ApiProperty({
    name: 'nonce',
    description: 'Nonce used to sign the deposit data',
    example: 5,
    required: true,
  })
  readonly nonce: number;

  @ApiProperty({
    name: 'moreValidators',
    description: 'Whether there are more validators to register',
    example: false,
    required: true,
  })
  readonly moreValidators: boolean;

  @ApiProperty({
    name: 'signature',
    description: 'Signature of the oracle',
    example: '0x1234567890...',
    required: true,
  })
  readonly signature: string;
}
