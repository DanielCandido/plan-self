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

export interface ConstructionProject {
  siteName: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  clientName: string | null;
  clientDocument: string | null;
  technicalManagerName: string | null;
  technicalManagerRegistry: string | null;
  artNumber: string | null;
  permitNumber: string | null;
  contractNumber: string | null;
  plannedStart: string | null;
  plannedEnd: string | null;
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
  construction: ConstructionProject | null;
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
  construction?: Partial<ConstructionProject>;
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
  construction?: Partial<ConstructionProject>;
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
  documentCode: string | null;
  category: 'DOCUMENT' | 'DRAWING' | 'SPECIFICATION' | 'REPORT' | string;
  discipline: string | null;
  status: 'CURRENT' | 'SUPERSEDED' | 'ARCHIVED' | string;
  createdAt: string;
  updatedAt: string;
  revisions: FileRevision[];
  latestRevision: FileRevision | null;
}

export interface ConstructionInspection {
  id: string;
  title: string;
  type: 'QUALITY' | 'SAFETY';
  inspectionDate: string;
  location: string | null;
  status: 'OPEN' | 'APPROVED' | 'REJECTED';
  checklist: Array<{ description: string; result: 'PASS' | 'FAIL' | 'NA'; note?: string }>;
  notes: string | null;
  inspector: { id: string; name: string };
  nonConformities: NonConformity[];
}

export interface NonConformity {
  id: string;
  inspectionId: string | null;
  code: string;
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  responsibleId: string | null;
  dueDate: string | null;
  resolution: string | null;
  resolvedAt: string | null;
  responsible?: { id: string; name: string } | null;
  inspection?: { id: string; title: string } | null;
}

export interface WeeklyPlanItem {
  id: string;
  description: string;
  unit: string;
  plannedQuantity: number;
  actualQuantity: number;
  status: 'PLANNED' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED';
  constraintNote: string | null;
  wbsNode: { code: string; name: string } | null;
  task: { id: string; code: string | null; title: string } | null;
}

export interface WeeklyPlan {
  id: string;
  weekStart: string;
  status: 'DRAFT' | 'CLOSED';
  notes: string | null;
  ppc: number;
  items: WeeklyPlanItem[];
}

export interface SiteDiaryPhoto { id: string; originalName: string; mimeType: string; size: number; caption: string | null; }
export interface SiteDiary {
  id: string; reportDate: string; weather: string | null; temperature: number | null;
  workforce: Array<{ role: string; quantity: number }>; equipment: Array<{ description: string }>;
  services: Array<{ description: string }>; occurrences: Array<{ description: string }>;
  notes: string | null; status: 'DRAFT' | 'CLOSED'; photos: SiteDiaryPhoto[];
}
