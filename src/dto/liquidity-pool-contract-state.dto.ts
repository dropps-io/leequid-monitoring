import { ApiProperty } from '@nestjs/swagger';

export class LiquidityPoolContractStateDto {
  @ApiProperty({
    name: 'totalSupply',
    description: 'The total amount of liquidity, in WEI',
    example: '100000000000000000000000000000000',
    required: true,
  })
  readonly totalSupply: string;

  @ApiProperty({
    name: 'reserveLyx',
    description: 'The total reserve of LYX, in WEI',
    example: '100000000000',
    required: true,
  })
  readonly reserveLyx: string;

  @ApiProperty({
    name: 'reserveSLyx',
    description: 'The total reserve of sLYX, in WEI',
    example: '100000000000',
    required: true,
  })
  readonly reserveSLyx: string;
}
