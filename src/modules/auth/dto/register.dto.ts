import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiJ9...' })
  @IsString()
  emailToken!: string;

  @ApiProperty({ example: 'Alisher Yondoshev' })
  @IsString()
  @MinLength(3)
  fullName!: string;

  @ApiProperty({ example: 'Password123' })
  @IsString()
  @MinLength(6)
  password!: string;
}
