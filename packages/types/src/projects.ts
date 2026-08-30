export type ProjectStatus =
  | 'PLANNED'
  | 'ON_TRACK'
  | 'AT_RISK'
  | 'OFF_TRACK'
  | 'COMPLETED'
  | 'ON_HOLD'
  | 'CANCELLED';

export type ProjectPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ProjectProfile = 'GENERAL' | 'CONSTRUCTION_SITE';
export type ProjectMemberRole = 'OWNER' | 'MANAGER' | 'CONTRIBUTOR' | 'VIEWER';

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
  profile: ProjectProfile;
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
  profile?: ProjectProfile;
}

export interface UpdateProjectPayload {
  name?: string;
  description?: string;
  teamId?: string;
  ownerId?: string;
  priority?: string;
  color?: string;
  status?: string;
  profile?: ProjectProfile;
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
  role: ProjectMemberRole;
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
  boardColumnId: string | null;
  boardColumnType: string | null;
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

export type WbsNodeType = 'PHASE' | 'DELIVERABLE' | 'WORK_PACKAGE';
export type TaskDependencyType = 'FINISH_TO_START' | 'START_TO_START' | 'FINISH_TO_FINISH' | 'START_TO_FINISH';

export interface WbsNode {
  id: string;
  projectId: string;
  parentId: string | null;
  code: string;
  name: string;
  description: string | null;
  type: WbsNodeType;
  position: number;
  _count: { tasks: number; children: number };
}

export interface TaskDependency {
  id: string;
  blockerTaskId: string;
  blockedTaskId: string;
  type: TaskDependencyType;
  lagDays: number;
  critical: boolean;
}

export interface TimelineTask {
  id: string;
  code: string | null;
  title: string;
  wbsNodeId: string | null;
  plannedStart: string | null;
  plannedEnd: string | null;
  blocked: boolean;
  state: string;
}

export interface ProjectTimeline {
  wbs: Omit<WbsNode, '_count'>[];
  tasks: TimelineTask[];
  dependencies: TaskDependency[];
}

export interface FileRevision {
  id: string;
  revision: number;
  originalName: string;
  mimeType: string;
  size: number;
  sha256: string;
  note: string | null;
  createdAt: string;
  uploadedBy: { id: string; name: string };
}

export interface ProjectFile {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  revisions: FileRevision[];
  latestRevision: FileRevision | null;
}
