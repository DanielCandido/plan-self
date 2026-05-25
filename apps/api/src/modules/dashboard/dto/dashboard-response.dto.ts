import { ApiProperty } from '@nestjs/swagger';

export class DashboardSprintDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  progress!: number;

  @ApiProperty()
  remainingDays!: number;

  @ApiProperty()
  completedTasks!: number;

  @ApiProperty()
  totalTasks!: number;

  @ApiProperty()
  blockedTasks!: number;

  @ApiProperty()
  estimatedHours!: number;
}

export class DashboardProductivityDto {
  @ApiProperty()
  averageLeadTime!: number;

  @ApiProperty()
  throughput!: number;

  @ApiProperty()
  weeklyCompletionRate!: number;

  @ApiProperty()
  activeTimeToday!: number;
}

export class DashboardTaskAssigneeDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ required: false, nullable: true })
  avatar!: string | null;
}

export class DashboardTaskDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  priority!: string;

  @ApiProperty({ nullable: true })
  dueDate!: string | null;

  @ApiProperty()
  project!: string;

  @ApiProperty({ type: [DashboardTaskAssigneeDto] })
  assignees!: DashboardTaskAssigneeDto[];
}

export class DashboardActivityDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  type!: string;

  @ApiProperty()
  user!: string;

  @ApiProperty({ required: false, nullable: true })
  task!: string | null;

  @ApiProperty()
  createdAt!: string;
}

export class DashboardSummaryDto {
  @ApiProperty()
  completedTasks!: number;

  @ApiProperty()
  efficiency!: number;

  @ApiProperty()
  activeUsers!: number;
}

export class DashboardResponseDto {
  @ApiProperty({ type: DashboardSprintDto, nullable: true })
  sprint!: DashboardSprintDto | null;

  @ApiProperty({ type: DashboardProductivityDto })
  productivity!: DashboardProductivityDto;

  @ApiProperty({ type: [DashboardTaskDto] })
  myTasks!: DashboardTaskDto[];

  @ApiProperty({ type: [DashboardActivityDto] })
  recentActivities!: DashboardActivityDto[];

  @ApiProperty({ type: DashboardSummaryDto })
  summary!: DashboardSummaryDto;
}
