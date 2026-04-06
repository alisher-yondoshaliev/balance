import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateContractDto {
  @ApiPropertyOptional({ example: 'Yangi izoh' })
  @IsOptional()
  @IsString()
  note?: string;
}
