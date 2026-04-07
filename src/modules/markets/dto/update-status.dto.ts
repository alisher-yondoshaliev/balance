import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MarketStatus } from '@prisma/client';

export class UpdateMarketStatusDto {
  @ApiProperty({ enum: MarketStatus })
  @IsEnum(MarketStatus)
  status!: MarketStatus;
}
