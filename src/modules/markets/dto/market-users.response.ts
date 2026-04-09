import { ApiProperty } from '@nestjs/swagger';
import { Role, UserStatus } from '@prisma/client';

export class MarketUserResponse {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ example: 'Alisher Yondoshaliyev' })
  fullName!: string;

  @ApiProperty({ example: 'alisher@example.com' })
  email!: string;

  @ApiProperty({
    example: 'ADMIN',
    enum: [Role.ADMIN, Role.MANAGER, Role.SELLER, Role.OWNER],
  })
  role!: Role;

  @ApiProperty({
    example: 'ACTIVE',
    enum: Object.values(UserStatus),
  })
  status!: UserStatus;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440001',
    description: 'Market ID this user belongs to',
  })
  marketId!: string;

  @ApiProperty({ example: '+998901234567', required: false })
  phone?: string;

  @ApiProperty({ example: '2026-04-07T10:00:00.000Z' })
  createdAt!: Date;
}
