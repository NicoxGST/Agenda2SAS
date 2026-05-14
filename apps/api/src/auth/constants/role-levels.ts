import { Role } from '@prisma/client';

export const ROLE_LEVELS: Record<Role, number> = {
  SUPER_ADMIN: 4,
  ADMIN: 3,
  WORKER: 2,
  CLIENT: 1,
};