export type Role = 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER' | 'GUEST';

export type TaskState =
  | 'BACKLOG'
  | 'TODO'
  | 'IN_PROGRESS'
  | 'REVIEW'
  | 'DONE'
  | 'BLOCKED';

export interface TenantContext {
  organizationId: string;
  teamId?: string;
}
