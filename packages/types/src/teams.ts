export type TeamVisibility = 'PUBLIC' | 'PRIVATE' | 'SECRET';
export type MemberStatus = 'ONLINE' | 'OFFLINE' | 'AWAY' | 'BUSY' | 'IN_MEETING';
export type TeamModalType = 'create' | 'edit' | 'invite' | 'settings' | 'delete' | null;

export interface TeamItem {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  description: string | null;
  avatarUrl: string | null;
  color: string | null;
  visibility: TeamVisibility;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  memberCount: number;
  activeProjects: number;
  recentActivityAt: string | null;
}

export interface TeamMemberItem {
  id: string;
  teamId: string;
  userId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: string;
  status: MemberStatus;
  workload: number;
  projects: number;
  team?: string;
  lastActivityAt: string | null;
  suspendedAt: string | null;
}

export interface TeamInviteItem {
  id: string;
  email: string;
  token: string;
  organizationId: string;
  teamId: string;
  invitedById: string;
  role: string;
  expiresAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}

export interface TeamListResponse {
  items: TeamItem[];
  totalCount: number;
}

export interface TeamDirectoryResponse {
  items: TeamMemberItem[];
  totalCount: number;
}

export interface CreateTeamPayload {
  name: string;
  description?: string;
  avatarUrl?: string;
  color?: string;
  visibility?: TeamVisibility;
  ownerId?: string;
  memberIds?: string[];
}

export interface UpdateTeamPayload {
  name?: string;
  slug?: string;
  description?: string;
  avatarUrl?: string;
  color?: string;
  visibility?: TeamVisibility;
  ownerId?: string;
}

export interface InvitePayload {
  emails: string[];
  role?: string;
  expiresInDays?: number;
}

export interface UpdateMemberRolePayload {
  role?: string;
  status?: MemberStatus;
  workload?: number;
  suspended?: boolean;
}
