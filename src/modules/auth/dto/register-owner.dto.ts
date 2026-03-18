import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class RegisterOwnerDto {
  @ApiProperty({
    example: 'Ali Valiyev',
    description: "Owner to'liq ism-familiyasi",
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: string }) => value?.trim())
  fullName: string;

  @ApiPropertyOptional({
    example: '+998901234567',
    description: "Telefon raqam (email bo'lmasa majburiy)",
  })
  @ValidateIf((dto: RegisterOwnerDto) => !dto.email)
  @IsNotEmpty({ message: 'Telefon yoki emaildan kamida bittasi majburiy' })
  @IsString()
  @Matches(/^\+998\d{9}$/, {
    message: 'Telefon format: +998901234567',
  })
  @IsOptional()
  @Transform(({ value }: { value: string }) => value?.replace(/\s+/g, ''))
  phone?: string;

  @ApiPropertyOptional({
    example: 'owner@example.com',
    description: "Email (telefon bo'lmasa majburiy)",
  })
  @ValidateIf((dto: RegisterOwnerDto) => !dto.phone)
  @IsNotEmpty({ message: 'Telefon yoki emaildan kamida bittasi majburiy' })
  @IsEmail()
  @IsOptional()
  @Transform(({ value }: { value: string }) => value?.trim().toLowerCase())
  email?: string;

  @ApiProperty({
    example: 'StrongPass123',
    description: 'Parol (kamida 8 ta belgi)',
  })
  @IsString()
  @MinLength(8, { message: "Parol kamida 8 ta belgi bo'lishi kerak" })
  password: string;
}
