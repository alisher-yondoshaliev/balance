import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  NotificationChannel,
  NotificationReason,
  NotificationStatus,
} from '@prisma/client';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';

export class ListNotificationsQueryDto {
  @ApiPropertyOptional({
    enum: NotificationStatus,
    enumName: 'NotificationStatus',
  })
  @IsOptional()
  @IsEnum(NotificationStatus)
  status?: NotificationStatus;

  @ApiPropertyOptional({
    enum: NotificationReason,
    enumName: 'NotificationReason',
  })
  @IsOptional()
  @IsEnum(NotificationReason)
  reason?: NotificationReason;

  @ApiPropertyOptional({ example: '2026-03-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ example: '2026-03-31T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  to?: string;
}

export class NotificationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  customerId: string;

  @ApiPropertyOptional({ nullable: true })
  contractId: string | null;

  @ApiPropertyOptional({ nullable: true })
  installmentId: string | null;

  @ApiProperty({ enum: NotificationChannel, enumName: 'NotificationChannel' })
  channel: NotificationChannel;

  @ApiProperty({
    enum: NotificationReason,
    enumName: 'NotificationReason',
  })
  reason: NotificationReason;

  @ApiProperty({
    enum: NotificationStatus,
    enumName: 'NotificationStatus',
  })
  status: NotificationStatus;

  @ApiProperty()
  message: string;

  @ApiPropertyOptional({ nullable: true })
  sentAt: Date | null;

  @ApiPropertyOptional({ nullable: true })
  error: string | null;

  @ApiProperty()
  createdAt: Date;
}
