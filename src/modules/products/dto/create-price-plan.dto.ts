import { IsNumber, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePricePlanDto {
  @ApiProperty({ example: 12, description: 'Muddat (oy)' })
  @IsInt()
  @Min(1)
  termMonths: number = 0;

  @ApiProperty({ example: 15.5, description: 'Foiz stavkasi' })
  @IsNumber()
  @Min(0)
  interestRate: number = 0;

  @ApiProperty({ example: 13800000, description: 'Umumiy narx' })
  @IsNumber()
  @Min(0)
  totalPrice: number = 0;

  @ApiProperty({ example: 1150000, description: "Oylik to'lov" })
  @IsNumber()
  @Min(0)
  monthlyPrice: number = 0;
}
