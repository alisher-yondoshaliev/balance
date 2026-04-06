import {
  IsString,
  IsOptional,
  IsNumber,
  IsUUID,
  Min,
  MaxLength,
  MinLength,
  IsInt,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'market-uuid' })
  @IsUUID()
  marketId: string = '';

  @ApiProperty({ example: 'category-uuid' })
  @IsUUID()
  categoryId: string = '';

  @ApiProperty({ example: 'iPhone 15 Pro' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name: string = '';

  @ApiPropertyOptional({ example: 'Yangi model' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'https://image.url/photo.jpg' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ example: 10 })
  @IsInt()
  @Min(0)
  stock: number = 0;

  @ApiProperty({ example: 12000000 })
  @IsNumber()
  @Min(0)
  basePrice: number = 0;
}
