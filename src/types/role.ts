import type { TRole } from 'librechat-data-provider';

export type RolePermissions = Record<string, Record<string, boolean>>;

export interface Role extends Omit<TRole, 'permissions'> {
  id: string;
  description: string;
  isSystemRole: boolean;
  isActive: boolean;
  userCount: number;
  permissions: RolePermissions;
}
