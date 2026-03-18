import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class SignContractDto {
  @ApiProperty({
    example: 'https://cdn.example.com/signatures/contract-sign.png',
    description: 'Imzo rasmi URL manzili',
  })
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  signatureUrl: string;

  @ApiProperty({
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  userAgent: string;

  @ApiProperty({
    example: '192.168.1.20',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(45)
  ipAddress: string;

  @ApiProperty({
    example: 'Mijoz shartnoma bilan tanishib rozilik bildirdi',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
