import { ApiProperty } from '@nestjs/swagger';

import { DepositDataDto } from './deposit-data.dto';

export class ActivateValidatorsDto {
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
  readonly depositData: DepositDataDto[];

  @ApiProperty({
    name: 'nonce',
    description: 'Nonce used to sign the deposit data',
    example: 5,
    required: true,
  })
  readonly nonce: number;

  @ApiProperty({
    name: 'signatures',
    description: 'Signatures of the oracles',
    example: ['0x1234567890...', '0x1234567890...'],
    required: true,
  })
  readonly signatures: string[];
}
