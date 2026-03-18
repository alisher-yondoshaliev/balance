import { PartialType } from '@nestjs/swagger';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { MarketStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateMarketDto } from './create-market.dto';

export class UpdateMarketDto extends PartialType(CreateMarketDto) {
  @ApiPropertyOptional({ enum: MarketStatus, enumName: 'MarketStatus' })
  @IsOptional()
  @IsEnum(MarketStatus)
  status?: MarketStatus;
}
