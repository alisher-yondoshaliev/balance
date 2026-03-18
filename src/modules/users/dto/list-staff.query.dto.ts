import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class ListStaffQueryDto {
  @ApiPropertyOptional({
    example: '2cbf6f7d-5b14-4ad6-98ce-46f0ca6b95ec',
    description: 'Owner uchun ixtiyoriy market filtri',
  })
  @IsOptional()
  @IsUUID('4')
  marketId?: string;
}
