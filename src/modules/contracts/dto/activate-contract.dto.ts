import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsOptional } from 'class-validator';

export class ActivateContractDto {
  @ApiPropertyOptional({
    example: '2026-03-18T09:00:00.000Z',
    description: 'Agar yuborilmasa hozirgi sana olinadi',
  })
  @IsOptional()
  @IsDateString()
  @Type(() => String)
  startDate?: string;
}
