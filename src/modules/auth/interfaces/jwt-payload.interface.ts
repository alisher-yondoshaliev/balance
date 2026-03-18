import { Role } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  login: string;
  role: Role;
}
