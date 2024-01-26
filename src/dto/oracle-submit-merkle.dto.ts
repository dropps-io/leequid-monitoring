import { ApiProperty } from '@nestjs/swagger';

export class OracleSubmitMerkleDto {
  @ApiProperty({
    name: 'merkleRoot',
    description: 'The merkle root of the tokens distribution',
    example: '0x1234567890...',
    required: true,
  })
  readonly merkleRoot: string;

  @ApiProperty({
    name: 'merkleProofsURI',
    description: 'The IPFS CID containing the merkle proofs',
    example: 'ipfs://Qm1234567890...',
    required: true,
  })
  readonly merkleProofsURI: string;

  @ApiProperty({
    name: 'signature',
    description: 'Signature of the oracle',
    example: '0x1234567890...',
    required: true,
  })
  readonly signature: string;
}
