import { Role } from '@prisma/client';

export const ROLE_LEVELS = {
  [Role.CLIENT]: 1,

  [Role.WORKER]: 2,

  [Role.ADMIN]: 3,

  [Role.SUPER_ADMIN]: 4,
};