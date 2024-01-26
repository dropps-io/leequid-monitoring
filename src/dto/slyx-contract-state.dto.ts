import { ApiProperty } from '@nestjs/swagger';

export class SLyxContractStateDto {
  @ApiProperty({
    name: 'totalSupply',
    description: 'The total amount of sLYX, in WEI',
    example: '100000000000000000000000000000000',
    required: true,
  })
  readonly totalSupply: string;

  @ApiProperty({
    name: 'totalUnstaked',
    description: 'The total amount of unstaked sLYX, in WEI',
    example: '100000000000',
    required: true,
  })
  readonly totalUnstaked: string;

  @ApiProperty({
    name: 'totalPendingUnstake',
    description: 'The total amount of sLYX pending unstake, in wei',
    example: '100000000000000000',
    required: true,
  })
  readonly totalPendingUnstake: string;

  @ApiProperty({
    name: 'totalClaimableUnstakes',
    description: 'The total amount claimable unstakes, in wei',
    example: '100000000000000000',
    required: true,
  })
  readonly totalClaimableUnstakes: string;

  @ApiProperty({
    name: 'unstakeRequestCount',
    description: 'The total number of unstake requests',
    example: 100000,
    required: true,
  })
  readonly unstakeRequestCount: number;

  @ApiProperty({
    name: 'unstakeRequestCurrentIndex',
    description: 'The current position of the unstake request queue',
    example: 100000,
    required: true,
  })
  readonly unstakeRequestCurrentIndex: number;

  @ApiProperty({
    name: 'unstakeProcessing',
    description: 'The current state of the unstake processing (is matching allowed or not)',
    example: false,
    required: true,
  })
  readonly unstakeProcessing: boolean;
}
