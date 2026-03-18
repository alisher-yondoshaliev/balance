import { ApiPropertyOptional } from '@nestjs/swagger';
import { ContractStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';

export class ListContractsQueryDto {
  @ApiPropertyOptional({ example: '2cbf6f7d-5b14-4ad6-98ce-46f0ca6b95ec' })
  @IsOptional()
  @IsUUID('4')
  marketId?: string;

  @ApiPropertyOptional({ example: '5e27ad4e-8afd-4cd9-95ca-17c4d82f9f15' })
  @IsOptional()
  @IsUUID('4')
  customerId?: string;

  @ApiPropertyOptional({ enum: ContractStatus, enumName: 'ContractStatus' })
  @IsOptional()
  @IsEnum(ContractStatus)
  status?: ContractStatus;
}
