import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateContractItemDto {
  @ApiProperty({ example: '53e9a44a-0ecd-4a95-b00c-a7a43703ea0a' })
  @IsUUID('4')
  productId: string;

  @ApiProperty({ example: '7f4f4de1-9fe9-4b73-b4b4-4f6b80215cad' })
  @IsUUID('4')
  pricePlanId: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity?: number;
}

export class CreateContractDto {
  @ApiProperty({ example: '2cbf6f7d-5b14-4ad6-98ce-46f0ca6b95ec' })
  @IsUUID('4')
  marketId: string;

  @ApiProperty({ example: '5e27ad4e-8afd-4cd9-95ca-17c4d82f9f15' })
  @IsUUID('4')
  customerId: string;

  @ApiProperty({ example: 12 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  termMonths: number;

  @ApiPropertyOptional({ example: 500000, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  downPayment?: number;

  @ApiPropertyOptional({ example: 'Mijoz bilan kelishilgan' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  note?: string;

  @ApiProperty({ type: [CreateContractItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateContractItemDto)
  items: CreateContractItemDto[];
}
