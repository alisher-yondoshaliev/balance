import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePlanDto {
  @ApiProperty({ example: 'Basic' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string = '';

  @ApiProperty({ example: 30, description: 'Kunlarda' })
  @IsNumber()
  @Min(1)
  duration: number = 0;

  @ApiProperty({ example: 99000 })
  @IsNumber()
  @Min(0)
  price: number = 0;

  @ApiPropertyOptional({ example: '30 kunlik obuna' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
