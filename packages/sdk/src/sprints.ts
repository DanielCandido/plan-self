import type {
  AddSprintTasksPayload,
  CompleteSprintPayload,
  CreateSprintPayload,
  MoveTaskPayload,
  ProjectBacklogResponse,
  ProjectSprintBoardResponse,
  ReorderTaskPayload,
  SprintHistoryEntry,
  SprintMetricSnapshot,
  SprintSummary,
  UpdateSprintPayload,
  UpdateTaskPayload,
  BurndownPoint,
} from '@plan-self/types';

export interface SprintClientOptions {
  baseUrl: string;
  token?: string;
}

export class SprintClient {
  constructor(private readonly getOptions: () => SprintClientOptions) {}

  getProjectBoard(projectId: string): Promise<ProjectSprintBoardResponse> {
    return this.request<ProjectSprintBoardResponse>(`/projects/${projectId}/sprints`);
  }

  getActiveSprint(projectId: string): Promise<SprintSummary> {
    return this.request<SprintSummary>(`/projects/${projectId}/sprints/active`);
  }

  getBacklog(projectId: string, query?: URLSearchParams): Promise<ProjectBacklogResponse> {
    const qs = query?.toString();
    return this.request<ProjectBacklogResponse>(`/projects/${projectId}/backlog${qs ? `?${qs}` : ''}`);
  }

  createSprint(payload: CreateSprintPayload): Promise<SprintSummary> {
    return this.request<SprintSummary>('/sprints', { method: 'POST', body: JSON.stringify(payload) });
  }

  updateSprint(sprintId: string, payload: UpdateSprintPayload): Promise<SprintSummary> {
    return this.request<SprintSummary>(`/sprints/${sprintId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  deleteSprint(sprintId: string): Promise<void> {
    return this.request<void>(`/sprints/${sprintId}`, { method: 'DELETE' });
  }

  startSprint(sprintId: string): Promise<SprintSummary> {
    return this.request<SprintSummary>(`/sprints/${sprintId}/start`, { method: 'POST' });
  }

  completeSprint(sprintId: string, payload?: CompleteSprintPayload): Promise<SprintSummary> {
    return this.request<SprintSummary>(`/sprints/${sprintId}/complete`, {
      method: 'POST',
      body: JSON.stringify(payload ?? {}),
    });
  }

  cancelSprint(sprintId: string): Promise<SprintSummary> {
    return this.request<SprintSummary>(`/sprints/${sprintId}/cancel`, { method: 'POST' });
  }

  addSprintTasks(sprintId: string, payload: AddSprintTasksPayload): Promise<SprintSummary> {
    return this.request<SprintSummary>(`/sprints/${sprintId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  removeSprintTask(sprintId: string, taskId: string): Promise<SprintSummary> {
    return this.request<SprintSummary>(`/sprints/${sprintId}/tasks/${taskId}`, { method: 'DELETE' });
  }

  reorderTask(taskId: string, payload: ReorderTaskPayload): Promise<void> {
    return this.request<void>(`/tasks/${taskId}/reorder`, { method: 'PATCH', body: JSON.stringify(payload) });
  }

  moveTask(taskId: string, payload: MoveTaskPayload): Promise<void> {
    return this.request<void>(`/tasks/${taskId}/move`, { method: 'PATCH', body: JSON.stringify(payload) });
  }

  updateTask(taskId: string, payload: UpdateTaskPayload): Promise<void> {
    return this.request<void>(`/tasks/${taskId}`, { method: 'PATCH', body: JSON.stringify(payload) });
  }

  getBurndown(sprintId: string): Promise<BurndownPoint[]> {
    return this.request<BurndownPoint[]>(`/sprints/${sprintId}/burndown`);
  }

  getMetrics(sprintId: string): Promise<SprintMetricSnapshot[]> {
    return this.request<SprintMetricSnapshot[]>(`/sprints/${sprintId}/metrics`);
  }

  getHistory(sprintId: string): Promise<SprintHistoryEntry[]> {
    return this.request<SprintHistoryEntry[]>(`/sprints/${sprintId}/history`);
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const options = this.getOptions();
    const response = await fetch(`${options.baseUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
        ...(init?.headers ?? {}),
      },
    });

    if (!response.ok) {
      throw new Error(`sprint request failed: ${response.status}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  }
}
