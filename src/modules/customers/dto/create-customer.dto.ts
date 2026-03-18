import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateCustomerDto {
  @ApiPropertyOptional({
    example: '2cbf6f7d-5b14-4ad6-98ce-46f0ca6b95ec',
    description: 'Owner uchun majburiy, boshqalar uchun ixtiyoriy',
  })
  @IsOptional()
  @IsUUID('4')
  marketId?: string;

  @ApiProperty({ example: 'Valiyev Ali' })
  @IsString()
  @MaxLength(100)
  fullName: string;

  @ApiProperty({ example: '+998901234567' })
  @Matches(/^\+998\d{9}$/, { message: 'Telefon format: +998901234567' })
  phone: string;

  @ApiPropertyOptional({ example: 'Toshkent, Chilonzor' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiPropertyOptional({ example: 'AA1234567' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  passportSeria?: string;

  @ApiPropertyOptional({ example: '1998-05-15' })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiPropertyOptional({ example: 'Ishonchli mijoz' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}
