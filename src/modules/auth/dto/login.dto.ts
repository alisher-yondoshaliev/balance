import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: '+998901234567',
    description: 'Login (telefon yoki email)',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: string }) => value?.trim())
  login: string;

  @ApiProperty({
    example: 'StrongPass123',
    description: 'Parol',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}
