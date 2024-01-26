import { ApiProperty } from '@nestjs/swagger';

export class ValidatorsToGenerateDto {
  @ApiProperty({
    name: 'amount',
    description: 'Amount of validators to generate',
    example: 10,
    required: true,
  })
  readonly amount: number;

  @ApiProperty({
    name: 'fromIndex',
    description: 'Index from where generating the validator keys',
    example: 0,
    required: true,
  })
  readonly fromIndex: number;

  @ApiProperty({
    name: 'signature',
    description: 'Signature of the oracle',
    example: '0x1234567890...',
    required: true,
  })
  readonly signature: string;
}
