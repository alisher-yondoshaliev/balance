import { Role } from '@prisma/client';

const r: typeof Role = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  SELLER: 'SELLER',
  SUPERADMIN: 'SUPERADMIN'
};

console.log(r);
