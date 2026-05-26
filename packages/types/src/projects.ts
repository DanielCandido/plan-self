export type ProjectStatus =
  | 'PLANNED'
  | 'ON_TRACK'
  | 'AT_RISK'
  | 'OFF_TRACK'
  | 'COMPLETED'
  | 'ON_HOLD'
  | 'CANCELLED';

export type ProjectPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ProjectOwner {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface ProjectTeam {
  id: string;
  name: string;
}

export interface ProjectItem {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  status: ProjectStatus | string | null;
  priority: ProjectPriority | string | null;
  archived: boolean;
  progress: number;
  ownerId: string | null;
  teamId: string | null;
  owner: ProjectOwner | null;
  team: ProjectTeam | null;
  meta: {
    taskCount: number;
    completedTaskCount: number;
    progress: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProjectListResponse {
  items: ProjectItem[];
  totalCount: number;
}

export interface ProjectCountsResponse {
  total: number;
  withBacklog: number;
  completed: number;
}

export interface CreateProjectPayload {
  name: string;
  description?: string;
  teamId?: string;
  ownerId?: string;
  priority?: string;
  color?: string;
  status?: string;
}

export interface UpdateProjectPayload {
  name?: string;
  description?: string;
  teamId?: string;
  ownerId?: string;
  priority?: string;
  color?: string;
  status?: string;
}

export interface ArchiveProjectPayload {
  archive: boolean;
}

export interface ListProjectsQuery {
  page?: number;
  perPage?: number;
  q?: string;
  teamId?: string;
  ownerId?: string;
  status?: string;
  priority?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export interface ProjectMember {
  userId: string;
  name: string;
  avatarUrl: string | null;
  role: string;
}

export interface ProjectAvailableUser extends ProjectMember {
  isMember: boolean;
}

export interface ProjectOwnerOption {
  id: string;
  name: string;
  avatarUrl: string | null;
  role: string;
}

export interface ProjectTeamOption {
  id: string;
  name: string;
}

export interface ProjectTaskItem {
  id: string;
  title: string;
  description: string | null;
  state: string;
  priority: string;
  storyPoints: number | null;
  dueAt: string | null;
  sprintId: string | null;
  assignees: Array<{
    id: string;
    name: string;
    avatarUrl: string | null;
  }>;
  updatedAt: string;
}

export interface ProjectTaskListResponse {
  items: ProjectTaskItem[];
  totalCount: number;
}
