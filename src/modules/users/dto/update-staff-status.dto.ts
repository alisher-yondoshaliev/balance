import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum StaffManageStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BLOCKED = 'BLOCKED',
}

export class UpdateStaffStatusDto {
  @ApiProperty({ enum: StaffManageStatus, enumName: 'StaffManageStatus' })
  @IsEnum(StaffManageStatus)
  status: StaffManageStatus;
}
