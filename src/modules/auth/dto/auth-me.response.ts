import { ApiProperty } from '@nestjs/swagger';
import { UserStatus, Role } from '@prisma/client';

/**
 * Response DTO when SUPERADMIN calls GET /auth/me
 * NO market context - global user information only
 */
export class SuperAdminMeResponse {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ example: 'admin@example.com' })
  email!: string;

  @ApiProperty({ example: 'Admin User' })
  fullName!: string;

  @ApiProperty({
    example: 'SUPERADMIN',
    enum: [Role.SUPERADMIN],
    description: 'Always "SUPERADMIN" for this DTO',
  })
  role!: 'SUPERADMIN';

  @ApiProperty({
    example: 'ACTIVE',
    enum: Object.values(UserStatus),
  })
  status!: UserStatus;

  @ApiProperty({ example: '+998901234567', required: false })
  phone?: string;

  @ApiProperty({ example: '2026-04-07T10:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-04-07T10:00:00.000Z' })
  updatedAt!: string;

  // ❌ NO marketId field - SUPERADMIN has no market context
}

/**
 * Response DTO when OWNER/ADMIN/MANAGER/SELLER calls GET /auth/me
 * Includes optional market context based on role
 */
export class UserMeResponse {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ example: 'user@example.com' })
  email!: string;

  @ApiProperty({ example: 'John Doe' })
  fullName!: string;

  @ApiProperty({
    example: 'OWNER',
    enum: [Role.OWNER, Role.ADMIN, Role.MANAGER, Role.SELLER],
  })
  role!: Role;

  @ApiProperty({
    example: 'ACTIVE',
    enum: Object.values(UserStatus),
  })
  status!: UserStatus;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440001',
    required: false,
    description:
      'Present for OWNER, ADMIN, MANAGER, SELLER when assigned to market',
  })
  marketId?: string;

  @ApiProperty({
    example: 'My Market Name',
    required: false,
    description: 'For convenience - market name if marketId exists',
  })
  marketName?: string;

  @ApiProperty({ example: '+998901234567', required: false })
  phone?: string;

  @ApiProperty({ example: '2026-04-07T10:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-04-07T10:00:00.000Z' })
  updatedAt!: string;
}

/**
 * Union type for GET /auth/me response
 * Discriminated by role field
 */
export type AuthMeResponse = SuperAdminMeResponse | UserMeResponse;
