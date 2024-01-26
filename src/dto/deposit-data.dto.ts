import { ApiProperty } from '@nestjs/swagger';

export class DepositDataResponseDto {
  @ApiProperty({
    name: 'depositData',
    description: 'Array with the deposit data',
    example: [
      {
        publicKey: '0x12345...',
        withdrawalCredentials: '0x12345...',
        signature: '0x12345...',
        depositDataRoot: '0x12345...',
      },
    ],
    required: true,
  })
  readonly depositData: DepositDataDto[];

  @ApiProperty({
    name: 'merkleProofNodes',
    description: 'Merkle proof nodes of the deposit data',
    example: [
      ['0x1234567890...', ' 0x123456...'],
      ['0x1234567890...', '0x123456...'],
    ],
    required: true,
  })
  readonly merkleProofNodes: string[][];
}

export class DepositDataDto {
  @ApiProperty({
    name: 'publicKey',
    description: 'Public key of the validator',
    example: '0x1234567890...',
    required: true,
  })
  readonly publicKey: string;

  @ApiProperty({
    name: 'withdrawalCredentials',
    description: 'Withdrawal credentials of the validator',
    example: '0x0100000000000000000000000000000123456789...',
    required: true,
  })
  readonly withdrawalCredentials: string;

  @ApiProperty({
    name: 'signature',
    description: 'Signature of the validator',
    example: '0x1234567890...',
    required: true,
  })
  readonly signature: string;

  @ApiProperty({
    name: 'depositDataRoot',
    description: 'Deposit data root of the validator',
    example: '0x1234567890...',
    required: true,
  })
  readonly depositDataRoot: string;
}

export class DepositDataProofDto extends DepositDataDto {
  @ApiProperty({
    name: 'proof',
    description: 'Array with the merkle proof',
    example: ['0x1234567890...'],
    required: true,
  })
  readonly proof: string[];
}

export class DepositDataArrayDto {
  @ApiProperty({
    type: [DepositDataDto],
    description: 'Array of deposit data',
    example: [
      {
        publicKey: '0x1234567890...',
        withdrawalCredentials: '0x0100000000000000000000000000000123456789...',
        signature: '0x1234567890...',
        depositDataRoot: '0x1234567890...',
      },
    ],
    required: true,
  })
  readonly depositData: DepositDataDto[];
}
