import type { Role } from '@prisma/client';

export const ROLE_WEIGHT: Record<Role, number> = {
  OWNER: 5,
  ADMIN: 4,
  MANAGER: 3,
  MEMBER: 2,
  GUEST: 1,
};

export type TeamPolicyAction =
  | 'team:create'
  | 'team:update'
  | 'team:archive'
  | 'team:delete'
  | 'team:invite'
  | 'member:add'
  | 'member:remove'
  | 'member:updateRole';

const policy: Record<TeamPolicyAction, Role[]> = {
  'team:create': ['OWNER', 'ADMIN', 'MANAGER'],
  'team:update': ['OWNER', 'ADMIN', 'MANAGER'],
  'team:archive': ['OWNER', 'ADMIN', 'MANAGER'],
  'team:delete': ['OWNER', 'ADMIN'],
  'team:invite': ['OWNER', 'ADMIN', 'MANAGER'],
  'member:add': ['OWNER', 'ADMIN', 'MANAGER'],
  'member:remove': ['OWNER', 'ADMIN', 'MANAGER'],
  'member:updateRole': ['OWNER', 'ADMIN'],
};

export function canPerform(action: TeamPolicyAction, role: Role): boolean {
  return policy[action].includes(role);
}
