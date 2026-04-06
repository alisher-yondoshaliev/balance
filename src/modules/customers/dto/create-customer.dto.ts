import {
  IsString,
  IsOptional,
  IsDateString,
  MinLength,
  MaxLength,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCustomerDto {
  @ApiProperty({ example: 'uuid' })
  @IsUUID()
  marketId!: string;

  @ApiProperty({ example: 'Jasur Karimov' })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  fullName!: string;

  @ApiProperty({ example: '+998901234567' })
  @IsString()
  @MaxLength(20)
  phone!: string;

  @ApiPropertyOptional({ example: 'Toshkent, Chilonzor 12' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiPropertyOptional({ example: 'AA1234567' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  passportSeria?: string;

  @ApiPropertyOptional({ example: '1990-01-01' })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiPropertyOptional({ example: 'Doimiy mijoz' })
  @IsOptional()
  @IsString()
  note?: string;
}
