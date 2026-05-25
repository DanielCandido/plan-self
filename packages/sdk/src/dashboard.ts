import type {
  DashboardOverviewResponse,
  DashboardTask,
  DashboardTaskStatusPayload,
} from '@plan-self/types';

export interface DashboardClientOptions {
  baseUrl: string;
  token?: string;
}

export class DashboardClient {
  constructor(private readonly getOptions: () => DashboardClientOptions) {}

  async getOverview(): Promise<DashboardOverviewResponse> {
    return this.request<DashboardOverviewResponse>('/dashboard/overview');
  }

  async updateTaskStatus(taskId: string, payload: DashboardTaskStatusPayload): Promise<DashboardTask> {
    return this.request<DashboardTask>(`/dashboard/tasks/${taskId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
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
      throw new Error(`dashboard request failed: ${response.status}`);
    }

    return response.json() as Promise<T>;
  }
}
