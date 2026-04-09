import { ApiProperty } from '@nestjs/swagger';
import { MarketUserResponse } from './market-users.response';

export class MarketUsersListResponse {
  @ApiProperty({
    type: [MarketUserResponse],
    description: 'Array of users in the market',
  })
  items!: MarketUserResponse[];

  @ApiProperty({
    example: 5,
    description: 'Total number of users in this market',
  })
  total!: number;

  @ApiProperty({
    example: 'Shashlikxona',
    description: 'Market name for reference',
    required: false,
  })
  marketName?: string;
}
