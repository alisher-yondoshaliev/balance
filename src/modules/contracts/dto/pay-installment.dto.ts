import { IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PayInstallmentDto {
  @ApiProperty({ example: 'installment-uuid' })
  @IsUUID()
  installmentId: string = '';

  @ApiProperty({ example: 500000 })
  @IsNumber()
  @Min(1)
  amount: number = 0;

  @ApiPropertyOptional({ example: "Naqd to'lov" })
  @IsOptional()
  @IsString()
  note?: string;
}
