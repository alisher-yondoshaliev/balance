import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'market-uuid' })
  @IsUUID()
  marketId: string = '';

  @ApiProperty({ example: 'Telefonlar' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string = '';

  @ApiPropertyOptional({ example: 'https://image.url/photo.jpg' })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}
