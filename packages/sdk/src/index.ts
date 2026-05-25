import { DashboardClient } from './dashboard.js';
import { SprintClient } from './sprints.js';

export interface PlanSelfClientOptions {
  baseUrl: string;
  token?: string;
}

export class PlanSelfClient {
  readonly dashboard: DashboardClient;
  readonly sprints: SprintClient;

  constructor(private readonly options: PlanSelfClientOptions) {
    this.dashboard = new DashboardClient(() => this.options);
    this.sprints = new SprintClient(() => this.options);
  }

  async getHealth() {
    const response = await fetch(`${this.options.baseUrl}/health`, {
      headers: this.options.token ? { Authorization: `Bearer ${this.options.token}` } : {},
    });

    if (!response.ok) {
      throw new Error(`health request failed: ${response.status}`);
    }

    return response.json();
  }
}

export { DashboardClient } from './dashboard.js';

export { SprintClient } from './sprints.js';
