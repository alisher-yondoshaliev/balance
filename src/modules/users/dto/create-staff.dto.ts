import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MinLength,
  NotEquals,
  ValidateIf,
} from 'class-validator';

export class CreateStaffDto {
  @ApiProperty({
    example: 'Sardor Aliyev',
    description: 'Xodim toliq ism-familiyasi',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: string }) => value?.trim())
  fullName: string;

  @ApiPropertyOptional({
    example: '+998901234567',
    description: 'Telefon raqam (email bolmasa majburiy)',
  })
  @ValidateIf((dto: CreateStaffDto) => !dto.email)
  @IsNotEmpty({ message: 'Telefon yoki emaildan bittasi majburiy' })
  @IsOptional()
  @Matches(/^\+998\d{9}$/, {
    message: 'Telefon format: +998901234567',
  })
  @Transform(({ value }: { value: string }) => value?.replace(/\s+/g, ''))
  phone?: string;

  @ApiPropertyOptional({
    example: 'staff@example.com',
    description: 'Email (telefon bolmasa majburiy)',
  })
  @ValidateIf((dto: CreateStaffDto) => !dto.phone)
  @IsNotEmpty({ message: 'Telefon yoki emaildan bittasi majburiy' })
  @IsOptional()
  @IsEmail()
  @Transform(({ value }: { value: string }) => value?.trim().toLowerCase())
  email?: string;

  @ApiProperty({
    example: 'StrongPass123',
    description: 'Parol (kamida 8 ta belgi)',
  })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ enum: Role, enumName: 'Role' })
  @IsEnum(Role)
  @NotEquals(Role.OWNER, {
    message: 'OWNER rolini staff sifatida yaratib bolmaydi',
  })
  role: Role;

  @ApiPropertyOptional({
    example: '2cbf6f7d-5b14-4ad6-98ce-46f0ca6b95ec',
    description: 'Owner uchun market id (Admin uchun avtomatik olinadi)',
  })
  @IsOptional()
  @IsUUID('4')
  marketId?: string;
}
