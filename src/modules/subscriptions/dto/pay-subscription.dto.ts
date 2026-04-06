import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PaySubscriptionDto {
  @ApiProperty({ example: 'plan-uuid' })
  @IsUUID()
  planId: string = '';
}
