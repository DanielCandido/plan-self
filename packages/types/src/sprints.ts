type Role = 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER' | 'GUEST';
type TaskState = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'BLOCKED';

export type SprintStatus = 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type SprintAuditAction =
  | 'CREATED'
  | 'UPDATED'
  | 'DELETED'
  | 'TASK_ADDED'
  | 'TASK_REMOVED'
  | 'STARTED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DATES_CHANGED';

export interface SprintMember {
  userId: string;
  name: string;
  avatarUrl: string | null;
  dailyCapacity: number;
  availabilityPercent: number;
  totalCapacity: number;
}

export interface SprintTaskDependency {
  taskId: string;
  title: string;
  critical: boolean;
  state: TaskState;
}

export interface SprintTaskLabel {
  name: string;
  color?: string | null;
}

export interface SprintTaskAssignee {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface SprintEpicSummary {
  id: string;
  name: string;
  color: string | null;
}

export interface SprintTask {
  id: string;
  code: string;
  projectId: string;
  title: string;
  description: string | null;
  state: TaskState;
  priority: string;
  storyPoints: number;
  sortOrder: number;
  blockedReason: string | null;
  labels: SprintTaskLabel[];
  assignees: SprintTaskAssignee[];
  dependencies: SprintTaskDependency[];
  epic: SprintEpicSummary | null;
  sprintId: string | null;
  sprintTaskId: string | null;
  position: number;
  isBlocked: boolean;
  isDone: boolean;
  dueAt: string | null;
  updatedAt: string | null;
}

export interface SprintSummary {
  id: string;
  projectId: string;
  name: string;
  goal: string | null;
  objective: string | null;
  notes: string | null;
  status: SprintStatus;
  startDate: string | null;
  endDate: string | null;
  capacity: number;
  velocity: number;
  targetVelocity: number;
  storyPoints: number;
  completedPoints: number;
  remainingPoints: number;
  blockedPoints: number;
  progress: number;
  healthScore: number;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  memberCount: number;
  tasks: SprintTask[];
  members: SprintMember[];
  warnings: string[];
}

export interface SprintMetricSnapshot {
  id: string;
  createdAt: string;
  totalStoryPoints: number;
  completedPoints: number;
  remainingPoints: number;
  blockedPoints: number;
  progress: number;
  velocity: number;
  throughput: number;
  capacityUtilization: number;
  healthScore: number;
}

export interface BurndownPoint {
  id: string;
  snapshotDate: string;
  remainingPoints: number;
  completedPoints: number;
  blockedTasks: number;
}

export interface SprintHistoryEntry {
  id: string;
  action: SprintAuditAction;
  actorId: string | null;
  actorName: string | null;
  createdAt: string;
  metadata: Record<string, unknown> | null;
}

export interface EpicBacklogGroup {
  id: string;
  name: string;
  color: string | null;
  totalStoryPoints: number;
  taskCount: number;
  tasks: SprintTask[];
}

export interface BacklogPage {
  items: SprintTask[];
  grouped: EpicBacklogGroup[];
  nextCursor: string | null;
  totalCount: number;
}

export interface ProjectSprintBoardResponse {
  projectId: string;
  projectName: string;
  role: Role;
  permissions: {
    canManageSprint: boolean;
    canMoveAnyTask: boolean;
    canMoveOwnTasks: boolean;
    canEditCompletedSprint: boolean;
  };
  backlogCount?: number;
  teamMembers: Array<{ userId: string; name: string; avatarUrl: string | null }>;
  activeSprint: SprintSummary | null;
  sprints: SprintSummary[];
  metrics: SprintMetricSnapshot[];
  burndown: BurndownPoint[];
  history: SprintHistoryEntry[];
  velocityTrend: Array<{ sprintId: string; name: string; velocity: number; completedPoints: number }>;
}

export interface ProjectBacklogResponse extends BacklogPage {
  projectId: string;
  projectName: string;
  appliedFilters: {
    search: string;
    priority: string | null;
    epicId: string | null;
    assigneeId: string | null;
    sortBy: string;
    order: 'asc' | 'desc';
  };
}

export interface CreateSprintMemberPayload {
  userId: string;
  dailyCapacity?: number;
  availabilityPercent?: number;
}

export interface CreateSprintPayload {
  projectId: string;
  name: string;
  goal?: string;
  objective?: string;
  notes?: string;
  startDate: string;
  endDate: string;
  targetVelocity?: number;
  durationOverrideDays?: number;
  members: CreateSprintMemberPayload[];
}

export interface UpdateSprintPayload {
  name?: string;
  goal?: string;
  objective?: string;
  notes?: string;
  startDate?: string;
  endDate?: string;
  status?: SprintStatus;
  targetVelocity?: number;
  members?: CreateSprintMemberPayload[];
}

export interface AddSprintTasksPayload {
  taskIds: string[];
}

export interface CompleteSprintPayload {
  carryOverTaskIds?: string[];
  notes?: string;
}

export interface MoveTaskPayload {
  projectId: string;
  taskIds: string[];
  targetSprintId?: string | null;
  targetIndex?: number;
}

export interface ReorderTaskPayload {
  projectId: string;
  orderedTaskIds: string[];
  sprintId?: string | null;
}

export interface UpdateTaskPayload {
  title?: string;
  priority?: string;
  storyPoints?: number;
  labelNames?: string[];
  assigneeIds?: string[];
  blockedReason?: string | null;
}
