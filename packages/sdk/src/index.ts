import { DashboardClient } from './dashboard.js';

export interface PlanSelfClientOptions {
  baseUrl: string;
  token?: string;
}

export class PlanSelfClient {
  readonly dashboard: DashboardClient;

  constructor(private readonly options: PlanSelfClientOptions) {
    this.dashboard = new DashboardClient(() => this.options);
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
