export type DashboardTaskState =
  | 'BACKLOG'
  | 'TODO'
  | 'IN_PROGRESS'
  | 'REVIEW'
  | 'DONE'
  | 'BLOCKED';

export interface DashboardSprint {
  id: string;
  name: string;
  progress: number;
  remainingDays: number;
  completedTasks: number;
  totalTasks: number;
  blockedTasks: number;
  estimatedHours: number;
}

export interface DashboardProductivity {
  averageLeadTime: number;
  throughput: number;
  weeklyCompletionRate: number;
  activeTimeToday: number;
}

export interface DashboardTaskAssignee {
  id: string;
  name: string;
  avatar: string | null;
}

export interface DashboardTask {
  id: string;
  title: string;
  status: DashboardTaskState;
  priority: string;
  dueDate: string | null;
  project: string;
  assignees: DashboardTaskAssignee[];
}

export interface DashboardActivity {
  id: string;
  type: string;
  user: string;
  task: string | null;
  createdAt: string;
}

export interface DashboardSummary {
  completedTasks: number;
  efficiency: number;
  activeUsers: number;
}

export interface DashboardOverviewResponse {
  sprint: DashboardSprint | null;
  productivity: DashboardProductivity;
  myTasks: DashboardTask[];
  recentActivities: DashboardActivity[];
  summary: DashboardSummary;
}

export interface DashboardTaskStatusPayload {
  status: DashboardTaskState;
}
