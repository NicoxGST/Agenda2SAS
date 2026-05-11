import { Role } from '../enums/role.enum';

export function isSuperAdmin(role: Role): boolean {
  return role === Role.SUPER_ADMIN;
}

export function isAdmin(role: Role): boolean {
  return role === Role.ADMIN || role === Role.SUPER_ADMIN;
}

export function isWorker(role: Role): boolean {
  return (
    role === Role.WORKER ||
    role === Role.ADMIN ||
    role === Role.SUPER_ADMIN
  );
}

export function isClient(role: Role): boolean {
  return true;
}