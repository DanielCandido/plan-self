export interface TaskChecklistItem {
  id: string;
  title: string;
  done: boolean;
}

export interface TaskCommentAuthor {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface TaskComment {
  id: string;
  taskId: string;
  content: string;
  createdAt: string;
  author: TaskCommentAuthor;
}

export interface TaskHistoryActor {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface TaskHistoryEntry {
  id: string;
  action: string;
  fromStatus: string | null;
  toStatus: string | null;
  fromColumnId: string | null;
  toColumnId: string | null;
  createdAt: string;
  actor: TaskHistoryActor | null;
}

export type TaskActivityType = 'comment' | 'history';

export interface TaskActivity {
  type: TaskActivityType;
  id: string;
  createdAt: string;
  /** Present when type === 'comment' */
  comment?: TaskComment;
  /** Present when type === 'history' */
  history?: TaskHistoryEntry;
}

export interface TaskDetailAssignee {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface TaskDetailBoardColumn {
  id: string;
  name: string;
  type: string;
}

export interface TaskDetailSprint {
  id: string;
  name: string;
}

export interface TaskDetail {
  id: string;
  code: string | null;
  projectId: string;
  sprintId: string | null;
  boardColumnId: string | null;
  title: string;
  description: string | null;
  status: string;
  state: string;
  position: number;
  priority: string;
  points: number | null;
  blocked: boolean;
  blockedReason: string | null;
  dueDate: string | null;
  labels: string[];
  checklist: TaskChecklistItem[];
  assignees: TaskDetailAssignee[];
  comments: TaskComment[];
  history: TaskHistoryEntry[];
  boardColumn: TaskDetailBoardColumn | null;
  sprint: TaskDetailSprint | null;
  deletedAt: string | null;
  updatedAt: string;
  createdAt: string;
}
