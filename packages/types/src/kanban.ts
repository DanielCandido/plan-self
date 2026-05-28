export type BoardColumnType = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'BLOCKED';

export interface BoardColumn {
  id: string;
  name: string;
  order: number;
  type: BoardColumnType;
  wipLimit: number | null;
  taskCount: number;
}

export interface BoardTask {
  id: string;
  code: string;
  title: string;
  status: string;
  state: string;
  boardColumnId: string | null;
  sprintId: string | null;
  position: number;
  blocked: boolean;
  blockedReason: string | null;
  dueDate: string | null;
  points: number | null;
  updatedAt: string;
}

export interface KanbanBoardResponse {
  id: string;
  projectId: string;
  columns: BoardColumn[];
  tasks: BoardTask[];
}

export interface MoveBoardTaskPayload {
  projectId: string;
  taskId: string;
  targetColumnId: string;
  targetPosition?: number;
}

export interface ReorderBoardTaskPayload {
  projectId: string;
  columnId: string;
  orderedTaskIds: string[];
}
