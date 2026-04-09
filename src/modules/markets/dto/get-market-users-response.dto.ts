import { ApiProperty } from '@nestjs/swagger';
import { MarketUserResponse } from './market-users.response';

export class PaginationMeta {
  @ApiProperty({ example: 1, description: 'Joriy sahifa' })
  page!: number;

  @ApiProperty({ example: 10, description: 'Bir sahifada nechta natija' })
  limit!: number;

  @ApiProperty({ example: 45, description: 'Jami natijalari' })
  total!: number;

  @ApiProperty({ example: 5, description: 'Jami sahifalar soni' })
  totalPages!: number;

  @ApiProperty({ example: true, description: 'Keyingi sahifa mavjudmi?' })
  hasNextPage!: boolean;

  @ApiProperty({ example: false, description: 'Oldingi sahifa mavjudmi?' })
  hasPrevPage!: boolean;
}

export class GetMarketUsersResponse {
  @ApiProperty({
    type: [MarketUserResponse],
    description: "Do'konga tegishli xodimlar ro'yxati",
  })
  data!: MarketUserResponse[];

  @ApiProperty({
    type: PaginationMeta,
    description: 'Pagination metadatasi',
  })
  meta!: PaginationMeta;

  @ApiProperty({
    example: 'Shashlikxona',
    description: 'Market name',
  })
  marketName!: string;
}
