import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class ListProductPricePlansQueryDto {
  @ApiProperty({ example: '53e9a44a-0ecd-4a95-b00c-a7a43703ea0a' })
  @IsUUID('4')
  productId: string;

  @ApiProperty({ required: false, example: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  termMonths?: number;
}
