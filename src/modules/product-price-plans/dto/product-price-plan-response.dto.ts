import { ApiProperty } from '@nestjs/swagger';

export class ProductPricePlanResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  productId: string;

  @ApiProperty()
  termMonths: number;

  @ApiProperty({ example: '24.50' })
  interestRate: string;

  @ApiProperty({ example: '15200000.00' })
  totalPrice: string;

  @ApiProperty({ example: '1266666.67' })
  monthlyPrice: string;
}
