import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TaskState } from '@prisma/client';
import type { CurrentUserPayload } from '../auth/types/current-user.type';
import type {
  DashboardActivityDto,
  DashboardResponseDto,
  DashboardTaskDto,
} from './dto/dashboard-response.dto';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateDashboardTaskDto } from './dto/create-dashboard-task.dto';
import type { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { DashboardGateway } from './dashboard.gateway';

const TASK_UPDATED_ACTION = 'task.updated';
const TASK_CREATED_ACTION = 'task.created';
const TASK_COMPLETED_ACTION = 'task.completed';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dashboardGateway: DashboardGateway,
  ) {}

  async getOverview(currentUser: CurrentUserPayload): Promise<DashboardResponseDto> {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const activeSprint = await this.prisma.sprint.findFirst({
      where: {
        project: { organizationId: currentUser.organizationId },
        status: { in: ['ACTIVE', 'IN_PROGRESS', 'PLANNED'] },
      },
      include: {
        tasks: {
          select: {
            state: true,
            story: { select: { storyPoints: true } },
          },
        },
      },
      orderBy: [
        { status: 'asc' },
        { startDate: 'desc' },
      ],
    });

    const sprintTotalTasks = activeSprint?.tasks.length ?? 0;
    const sprintCompletedTasks =
      activeSprint?.tasks.filter((task) => task.state === TaskState.DONE).length ?? 0;
    const sprintBlockedTasks =
      activeSprint?.tasks.filter((task) => task.state === TaskState.BLOCKED).length ?? 0;

    const sprintProgress =
      sprintTotalTasks > 0 ? Math.round((sprintCompletedTasks / sprintTotalTasks) * 100) : 0;

    const sprintEstimatedHours =
      activeSprint?.tasks.reduce((sum, task) => sum + (task.story?.storyPoints ?? 0) * 2, 0) ?? 0;

    const remainingDays = activeSprint?.endDate
      ? Math.max(0, Math.ceil((activeSprint.endDate.getTime() - now.getTime()) / 86_400_000))
      : 0;

    const myAssignments = await this.prisma.taskAssignee.findMany({
      where: {
        userId: currentUser.id,
        task: {
          project: {
            organizationId: currentUser.organizationId,
          },
        },
      },
      include: {
        task: {
          include: {
            project: { select: { name: true } },
            assignees: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        },
      },
      take: 12,
      orderBy: {
        task: {
          dueAt: 'asc',
        },
      },
    });

    const myTasks: DashboardTaskDto[] = myAssignments.map(({ task }) => ({
      id: task.id,
      title: task.title,
      status: task.state,
      priority: task.priority,
      dueDate: task.dueAt ? task.dueAt.toISOString() : null,
      project: task.project.name,
      assignees: task.assignees.map(({ user }) => ({
        id: user.id,
        name: user.name,
        avatar: user.avatarUrl,
      })),
    }));

    const recentLogs = await this.prisma.auditLog.findMany({
      where: {
        organizationId: currentUser.organizationId,
      },
      orderBy: { createdAt: 'desc' },
      take: 12,
    });

    const actorIds = Array.from(
      new Set(recentLogs.map((log) => log.actorId).filter((actorId): actorId is string => Boolean(actorId))),
    );

    const actors = actorIds.length
      ? await this.prisma.user.findMany({
          where: {
            id: { in: actorIds },
            organizationId: currentUser.organizationId,
          },
          select: {
            id: true,
            name: true,
          },
        })
      : [];

    const actorById = new Map(actors.map((actor) => [actor.id, actor.name]));

    const recentActivities: DashboardActivityDto[] = recentLogs.map((log) => ({
      id: log.id,
      type: log.action,
      user: log.actorId ? actorById.get(log.actorId) ?? 'Sistema' : 'Sistema',
      task: this.readTaskTitle(log.metadata),
      createdAt: log.createdAt.toISOString(),
    }));

    const orgTaskAggregate = await this.prisma.task.aggregate({
      where: {
        project: {
          organizationId: currentUser.organizationId,
        },
      },
      _count: { _all: true },
    });

    const orgCompletedTasks = await this.prisma.task.count({
      where: {
        project: {
          organizationId: currentUser.organizationId,
        },
        state: TaskState.DONE,
      },
    });

    const throughput = await this.prisma.auditLog.count({
      where: {
        organizationId: currentUser.organizationId,
        action: TASK_COMPLETED_ACTION,
        createdAt: { gte: weekAgo },
      },
    });

    const weeklyCreated = await this.prisma.auditLog.count({
      where: {
        organizationId: currentUser.organizationId,
        action: TASK_CREATED_ACTION,
        createdAt: { gte: weekAgo },
      },
    });

    const weeklyCompletionRate =
      weeklyCreated > 0 ? Number(((throughput / weeklyCreated) * 100).toFixed(1)) : 0;

    const activeActionsToday = await this.prisma.auditLog.count({
      where: {
        organizationId: currentUser.organizationId,
        actorId: currentUser.id,
        createdAt: { gte: todayStart },
      },
    });

    const activeTimeToday = Number(Math.min(8, activeActionsToday * 0.2).toFixed(1));

    const activeUsersByDay = await this.prisma.auditLog.groupBy({
      by: ['actorId'],
      where: {
        organizationId: currentUser.organizationId,
        createdAt: { gte: todayStart },
        actorId: { not: null },
      },
      _count: { _all: true },
    });

    const sprintDurations = await this.prisma.sprint.findMany({
      where: {
        project: { organizationId: currentUser.organizationId },
        startDate: { not: null },
        endDate: { not: null },
      },
      select: {
        startDate: true,
        endDate: true,
      },
      take: 20,
      orderBy: { endDate: 'desc' },
    });

    const averageLeadTime =
      sprintDurations.length > 0
        ? Number(
            (
              sprintDurations.reduce((sum, sprint) => {
                const start = sprint.startDate?.getTime() ?? now.getTime();
                const end = sprint.endDate?.getTime() ?? now.getTime();
                return sum + Math.max(0, (end - start) / 86_400_000) / 2;
              }, 0) / sprintDurations.length
            ).toFixed(1),
          )
        : 0;

    return {
      sprint: activeSprint
        ? {
            id: activeSprint.id,
            name: activeSprint.name,
            progress: sprintProgress,
            remainingDays,
            completedTasks: sprintCompletedTasks,
            totalTasks: sprintTotalTasks,
            blockedTasks: sprintBlockedTasks,
            estimatedHours:
              sprintEstimatedHours > 0 ? sprintEstimatedHours : sprintTotalTasks * 4,
          }
        : null,
      productivity: {
        averageLeadTime,
        throughput,
        weeklyCompletionRate,
        activeTimeToday,
      },
      myTasks,
      recentActivities,
      summary: {
        completedTasks: orgCompletedTasks,
        efficiency:
          orgTaskAggregate._count._all > 0
            ? Number(((orgCompletedTasks / orgTaskAggregate._count._all) * 100).toFixed(1))
            : 0,
        activeUsers: activeUsersByDay.length,
      },
    };
  }

  async createTask(currentUser: CurrentUserPayload, dto: CreateDashboardTaskDto) {
    const project = await this.prisma.project.findFirst({
      where: {
        id: dto.projectId,
        organizationId: currentUser.organizationId,
      },
      select: { id: true, name: true },
    });

    if (!project) {
      throw new NotFoundException('Projeto não encontrado');
    }

    if (dto.sprintId) {
      const sprint = await this.prisma.sprint.findFirst({
        where: {
          id: dto.sprintId,
          projectId: project.id,
        },
        select: { id: true },
      });

      if (!sprint) {
        throw new BadRequestException('Sprint inválida para o projeto informado');
      }
    }

    const task = await this.prisma.task.create({
      data: {
        title: dto.title,
        priority: dto.priority ?? 'MEDIUM',
        dueAt: dto.dueDate ? new Date(dto.dueDate) : null,
        projectId: project.id,
        sprintId: dto.sprintId,
        assignees:
          dto.assigneeIds && dto.assigneeIds.length > 0
            ? {
                createMany: {
                  data: dto.assigneeIds.map((userId) => ({ userId })),
                  skipDuplicates: true,
                },
              }
            : undefined,
      },
      include: {
        project: { select: { name: true } },
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    await this.prisma.auditLog.create({
      data: {
        organizationId: currentUser.organizationId,
        actorId: currentUser.id,
        action: TASK_CREATED_ACTION,
        metadata: {
          taskId: task.id,
          taskTitle: task.title,
          projectId: task.projectId,
        },
      },
    });

    this.dashboardGateway.emitOrganizationEvent(currentUser.organizationId, TASK_CREATED_ACTION, {
      taskId: task.id,
      title: task.title,
      projectId: task.projectId,
      sprintId: task.sprintId,
    });

    if (task.sprintId) {
      this.dashboardGateway.emitOrganizationEvent(currentUser.organizationId, 'sprint.updated', {
        sprintId: task.sprintId,
        reason: 'task.created',
      });
    }

    return this.mapTask(task);
  }

  async updateTaskStatus(
    currentUser: CurrentUserPayload,
    taskId: string,
    dto: UpdateTaskStatusDto,
  ) {
    const existingTask = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        project: { organizationId: currentUser.organizationId },
      },
      include: {
        project: { select: { name: true } },
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (!existingTask) {
      throw new NotFoundException('Task não encontrada');
    }

    const task = await this.prisma.task.update({
      where: { id: existingTask.id },
      data: {
        state: dto.status,
      },
      include: {
        project: { select: { name: true } },
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    await this.prisma.auditLog.create({
      data: {
        organizationId: currentUser.organizationId,
        actorId: currentUser.id,
        action: TASK_UPDATED_ACTION,
        metadata: {
          taskId: task.id,
          taskTitle: task.title,
          from: existingTask.state,
          to: task.state,
        },
      },
    });

    if (dto.status === TaskState.DONE && existingTask.state !== TaskState.DONE) {
      await this.prisma.auditLog.create({
        data: {
          organizationId: currentUser.organizationId,
          actorId: currentUser.id,
          action: TASK_COMPLETED_ACTION,
          metadata: {
            taskId: task.id,
            taskTitle: task.title,
          },
        },
      });
    }

    this.dashboardGateway.emitOrganizationEvent(currentUser.organizationId, TASK_UPDATED_ACTION, {
      taskId: task.id,
      status: task.state,
      sprintId: task.sprintId,
    });

    if (task.sprintId) {
      this.dashboardGateway.emitOrganizationEvent(currentUser.organizationId, 'sprint.updated', {
        sprintId: task.sprintId,
        reason: 'task.updated',
      });
    }

    return this.mapTask(task);
  }

  private readTaskTitle(metadata: Prisma.JsonValue | null): string | null {
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
      return null;
    }

    const objectMetadata = metadata as Record<string, unknown>;

    const taskTitle = objectMetadata.taskTitle;
    if (typeof taskTitle === 'string') {
      return taskTitle;
    }

    const task = objectMetadata.task;
    if (typeof task === 'string') {
      return task;
    }

    return null;
  }

  private mapTask(task: {
    id: string;
    title: string;
    state: TaskState;
    priority: string;
    dueAt: Date | null;
    project: { name: string };
    assignees: Array<{
      user: {
        id: string;
        name: string;
        avatarUrl: string | null;
      };
    }>;
  }): DashboardTaskDto {
    return {
      id: task.id,
      title: task.title,
      status: task.state,
      priority: task.priority,
      dueDate: task.dueAt ? task.dueAt.toISOString() : null,
      project: task.project.name,
      assignees: task.assignees.map(({ user }) => ({
        id: user.id,
        name: user.name,
        avatar: user.avatarUrl,
      })),
    };
  }
}
