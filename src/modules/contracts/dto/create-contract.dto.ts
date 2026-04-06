import {
  IsUUID,
  IsNumber,
  IsDateString,
  IsOptional,
  IsString,
  Min,
  IsArray,
  ValidateNested,
  IsInt,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ContractItemDto {
  @ApiProperty({ example: 'product-uuid' })
  @IsUUID()
  productId: string = '';

  @ApiProperty({ example: 'price-plan-uuid' })
  @IsUUID()
  pricePlanId: string = '';

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  quantity: number = 0;
}

export class CreateContractDto {
  @ApiProperty({ example: 'market-uuid' })
  @IsUUID()
  marketId: string = '';

  @ApiProperty({ example: 'customer-uuid' })
  @IsUUID()
  customerId: string = '';

  @ApiProperty({ example: 12, description: 'Muddat (oy)' })
  @IsInt()
  @Min(1)
  termMonths: number = 0;

  @ApiPropertyOptional({ example: 500000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  downPayment?: number;

  @ApiProperty({ example: '2026-04-06' })
  @IsDateString()
  startDate: string = '';

  @ApiPropertyOptional({ example: 'Izoh' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiProperty({ type: [ContractItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContractItemDto)
  items: ContractItemDto[] = [];
}
