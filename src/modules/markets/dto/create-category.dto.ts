import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Telefonlar' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/category-phone.png',
  })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;
}
