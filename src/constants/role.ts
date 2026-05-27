import { PermissionTypes, Permissions } from 'librechat-data-provider';
import type * as t from '@/types';

export const AGENTX_PERMISSION_TYPES = {
  WORKBASE: 'WORKBASE',
} as const;

type AgentxPermissionType = (typeof AGENTX_PERMISSION_TYPES)[keyof typeof AGENTX_PERMISSION_TYPES];
type AdminPermissionType = PermissionTypes | AgentxPermissionType;

/** Maps each PermissionType to the subset of Permissions it supports. */
export const PERMISSION_TYPE_SCHEMA: Record<AdminPermissionType, Permissions[]> = {
  [PermissionTypes.BOOKMARKS]: [Permissions.USE],
  [PermissionTypes.PROMPTS]: [
    Permissions.USE,
    Permissions.CREATE,
    Permissions.SHARE,
    Permissions.SHARE_PUBLIC,
  ],
  [PermissionTypes.AGENTS]: [
    Permissions.USE,
    Permissions.CREATE,
    Permissions.SHARE,
    Permissions.SHARE_PUBLIC,
  ],
  [PermissionTypes.MEMORIES]: [
    Permissions.USE,
    Permissions.CREATE,
    Permissions.UPDATE,
    Permissions.READ,
    Permissions.OPT_OUT,
  ],
  [PermissionTypes.MULTI_CONVO]: [Permissions.USE],
  [PermissionTypes.TEMPORARY_CHAT]: [Permissions.USE],
  [PermissionTypes.RUN_CODE]: [Permissions.USE],
  [PermissionTypes.WEB_SEARCH]: [Permissions.USE],
  [PermissionTypes.PEOPLE_PICKER]: [
    Permissions.VIEW_USERS,
    Permissions.VIEW_GROUPS,
    Permissions.VIEW_ROLES,
  ],
  [PermissionTypes.MARKETPLACE]: [Permissions.USE],
  [PermissionTypes.FILE_SEARCH]: [Permissions.USE],
  [PermissionTypes.FILE_CITATIONS]: [Permissions.USE],
  [PermissionTypes.MCP_SERVERS]: [
    Permissions.USE,
    Permissions.CREATE,
    Permissions.SHARE,
    Permissions.SHARE_PUBLIC,
  ],
  [PermissionTypes.REMOTE_AGENTS]: [
    Permissions.USE,
    Permissions.CREATE,
    Permissions.SHARE,
    Permissions.SHARE_PUBLIC,
  ],
  [PermissionTypes.SKILLS]: [
    Permissions.USE,
    Permissions.CREATE,
    Permissions.SHARE,
    Permissions.SHARE_PUBLIC,
  ],
  [AGENTX_PERMISSION_TYPES.WORKBASE]: [
    Permissions.READ,
    Permissions.UPDATE,
    'REVIEW' as Permissions,
    'DELETE' as Permissions,
  ],
};

export function defaultPermissions(): t.RolePermissions {
  const perms = {} as t.RolePermissions;
  for (const type of Object.values(PermissionTypes)) {
    const section: Record<string, boolean> = {};
    for (const p of PERMISSION_TYPE_SCHEMA[type]) {
      section[p] = false;
    }
    perms[type] = section;
  }
  perms[AGENTX_PERMISSION_TYPES.WORKBASE] = {
    [Permissions.READ]: true,
    [Permissions.UPDATE]: false,
    REVIEW: false,
    DELETE: false,
  };
  return perms;
}
