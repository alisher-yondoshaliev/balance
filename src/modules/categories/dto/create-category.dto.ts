import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsUUID,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: "Bosh kategoriya yaratilishi kerak bo'lgan market ID'i",
  })
  @IsNotEmpty({ message: 'marketId kiritilishi shart' })
  @IsUUID('4', { message: "marketId tog'ri UUID formatda bo'lishi kerak" })
  marketId!: string;

  @ApiProperty({
    example: 'Telefonlar',
    description: 'Kategoriya nomi (2-100 ta belgi)',
  })
  @IsNotEmpty({ message: 'kategoriya nomi kiritilishi shart' })
  @IsString({ message: "kategoriya nomi matn bo'lishi kerak" })
  @MinLength(2, {
    message: "kategoriya nomi kamida 2 belgidan iborat bo'lishi kerak",
  })
  @MaxLength(100, { message: 'kategoriya nomi 100 belgidan oshmasligi kerak' })
  name!: string;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/categories/phones.jpg',
    description: 'Kategoriya uchun rasm URL (ixtiyoriy)',
  })
  @IsOptional()
  @IsString({ message: "rasm URL matn bo'lishi kerak" })
  imageUrl?: string;
}
