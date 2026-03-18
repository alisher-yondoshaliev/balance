import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MarketStatus } from '@prisma/client';

export class MarketResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  ownerId: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional({ nullable: true })
  address: string | null;

  @ApiPropertyOptional({ nullable: true })
  phone: string | null;

  @ApiProperty({ enum: MarketStatus, enumName: 'MarketStatus' })
  status: MarketStatus;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
