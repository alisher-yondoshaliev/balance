import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class ContractReportQueryDto {
  @ApiPropertyOptional({
    example: '2026-03-01T00:00:00.000Z',
    description: 'Boshlanish sanasi',
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({
    example: '2026-03-31T23:59:59.000Z',
    description: 'Tugash sanasi',
  })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({
    example: '2cbf6f7d-5b14-4ad6-98ce-46f0ca6b95ec',
    description: 'Owner uchun ixtiyoriy market filtri',
  })
  @IsOptional()
  @IsUUID('4')
  marketId?: string;

  @ApiPropertyOptional({
    example: '7a6b81d4-1a71-4f2d-b724-2f15ee340011',
    description: 'Ixtiyoriy staff filtri',
  })
  @IsOptional()
  @IsUUID('4')
  staffId?: string;
}
