import {
  IsOptional,
  IsString,
  IsNumberString,
  IsEnum,
  ValidateIf,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Role, UserStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class GetMarketUsersQueryDto {
  @ApiPropertyOptional({
    example: '1',
    description: 'Page raqami (default: 1)',
  })
  @IsOptional()
  @IsNumberString()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    example: '10',
    description: 'Bir sahifada nechta natija (default: 10, max: 100)',
  })
  @IsOptional()
  @IsNumberString()
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional({
    example: 'Ali',
    description: "Qidirish: ism, familiya, email yoki telefon bo'yicha",
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    example: 'ACTIVE',
    enum: Object.values(UserStatus),
    description: "Status bo'yicha filter",
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({
    example: 'SELLER',
    enum: [Role.ADMIN, Role.MANAGER, Role.SELLER],
    description: "Rolle bo'yicha filter",
  })
  @IsOptional()
  @IsEnum([Role.ADMIN, Role.MANAGER, Role.SELLER])
  role?: string;

  @ApiPropertyOptional({
    example: 'createdAt',
    enum: ['createdAt', 'fullName'],
    description: 'Tartiblash turi: createdAt, fullName (default: createdAt)',
  })
  @IsOptional()
  @IsEnum(['createdAt', 'fullName'])
  sortBy?: 'createdAt' | 'fullName' = 'createdAt';

  @ApiPropertyOptional({
    example: 'desc',
    enum: ['asc', 'desc'],
    description: "Tartiblash yo'nalishi: asc (kamroq), desc (ko'p)",
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  order?: 'asc' | 'desc' = 'desc';
}
