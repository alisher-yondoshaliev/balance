import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsUUID, Min } from 'class-validator';

export class CreateProductPricePlanDto {
  @ApiProperty({ example: '53e9a44a-0ecd-4a95-b00c-a7a43703ea0a' })
  @IsUUID('4')
  productId: string;

  @ApiProperty({ example: 12 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  termMonths: number;

  @ApiProperty({ example: 24.5 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  interestRate: number;

  @ApiProperty({ example: 15200000 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalPrice: number;

  @ApiProperty({ example: 1266666.67 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  monthlyPrice: number;
}
