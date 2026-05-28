import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TaskState, type Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export const taskInclude = {
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
  story: {
    include: {
      epic: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
    },
  },
  blockedByDependencies: {
    include: {
      blocker: {
        select: {
          id: true,
          title: true,
          state: true,
        },
      },
    },
  },
  sprintTasks: {
    select: {
      id: true,
      position: true,
    },
  },
} satisfies Prisma.TaskInclude;

export const sprintInclude = {
  members: {
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
  tasks: {
    where: {
      deletedAt: null,
    },
    include: taskInclude,
    orderBy: {
      sortOrder: 'asc',
    },
  },
  metrics: {
    orderBy: {
      createdAt: 'desc',
    },
    take: 10,
  },
  snapshots: {
    orderBy: {
      snapshotDate: 'asc',
    },
  },
  auditLogs: {
    include: {
      actor: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 50,
  },
} satisfies Prisma.SprintInclude;

export type HydratedTask = Prisma.TaskGetPayload<{ include: typeof taskInclude }>;
export type HydratedSprint = Prisma.SprintGetPayload<{ include: typeof sprintInclude }>;

@Injectable()
export class SprintRepository {
  constructor(public readonly prisma: PrismaService) {}

  async getProjectOrThrow(projectId: string, organizationId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, organizationId },
      include: {
        team: {
          include: {
            memberships: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    avatarUrl: true,
                    status: true,
                    role: true,
                  },
                },
              },
            },
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Projeto não encontrado');
    }

    return project;
  }

  async getProjectUsers(projectId: string, organizationId: string) {
    const project = await this.getProjectOrThrow(projectId, organizationId);

    if (project.team) {
      return project.team.memberships
        .filter((membership) => membership.user.status === 'ACTIVE')
        .map((membership) => ({
          userId: membership.user.id,
          name: membership.user.name,
          avatarUrl: membership.user.avatarUrl,
          role: membership.role,
        }));
    }

    const users = await this.prisma.user.findMany({
      where: { organizationId, status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        role: true,
      },
      orderBy: { name: 'asc' },
    });

    return users.map((user) => ({
      userId: user.id,
      name: user.name,
      avatarUrl: user.avatarUrl,
      role: user.role,
    }));
  }

  async getSprintOrThrow(sprintId: string, organizationId: string) {
    const sprint = await this.prisma.sprint.findFirst({
      where: {
        id: sprintId,
        project: { organizationId },
      },
      include: sprintInclude,
    });

    if (!sprint) {
      throw new NotFoundException('Sprint não encontrada');
    }

    return sprint;
  }

  async findActiveSprint(projectId: string) {
    return this.prisma.sprint.findFirst({
      where: {
        projectId,
        status: 'ACTIVE',
      },
      include: sprintInclude,
    });
  }

  async findCurrentActiveSprint(organizationId: string, projectId?: string) {
    return this.prisma.sprint.findFirst({
      where: {
        project: { organizationId },
        status: 'ACTIVE',
        ...(projectId ? { projectId } : {}),
      },
      include: sprintInclude,
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async listProjectSprints(projectId: string, organizationId: string) {
    return this.prisma.sprint.findMany({
      where: {
        projectId,
        project: { organizationId },
      },
      include: sprintInclude,
      orderBy: [{ startDate: 'desc' }, { createdAt: 'desc' }],
      take: 12,
    });
  }

  async listCompletedSprints(projectId: string) {
    return this.prisma.sprint.findMany({
      where: {
        projectId,
        status: 'COMPLETED',
      },
      select: {
        id: true,
        name: true,
        velocity: true,
        completedPoints: true,
      },
      orderBy: {
        completedAt: 'desc',
      },
      take: 6,
    });
  }

  async listBacklogTasks(
    projectId: string,
    organizationId: string,
    options: {
      page: number;
      limit: number;
      search: string;
      priority?: string;
      epicId?: string;
      assigneeId?: string;
      sortBy: string;
      order: Prisma.SortOrder;
    },
  ) {
    const where: Prisma.TaskWhereInput = {
      projectId,
      sprintId: null,
      deletedAt: null,
      project: { organizationId },
      ...(options.search.trim()
        ? {
            OR: [
              { title: { contains: options.search.trim(), mode: 'insensitive' } },
              { description: { contains: options.search.trim(), mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(options.priority ? { priority: options.priority } : {}),
      ...(options.epicId ? { story: { epicId: options.epicId } } : {}),
      ...(options.assigneeId ? { assignees: { some: { userId: options.assigneeId } } } : {}),
    };

    const orderBy =
      options.sortBy === 'storyPoints'
        ? [{ storyPoints: options.order }, { sortOrder: 'asc' as const }]
        : options.sortBy === 'updatedAt'
          ? [{ updatedAt: options.order }, { sortOrder: 'asc' as const }]
          : options.sortBy === 'title'
            ? [{ title: options.order }, { sortOrder: 'asc' as const }]
            : options.sortBy === 'priority'
              ? [{ priority: options.order }, { sortOrder: 'asc' as const }]
              : [{ sortOrder: options.order }, { createdAt: 'asc' as const }];

    const [items, totalCount, project] = await Promise.all([
      this.prisma.task.findMany({
        where,
        include: taskInclude,
        skip: options.page * options.limit,
        take: options.limit,
        orderBy,
      }),
      this.prisma.task.count({ where }),
      this.prisma.project.findFirst({
        where: { id: projectId, organizationId },
        select: { id: true, name: true },
      }),
    ]);

    if (!project) {
      throw new NotFoundException('Projeto não encontrado');
    }

    return { items, totalCount, project };
  }

  async getTaskOwnership(taskIds: string[], userId: string) {
    const owned = await this.prisma.taskAssignee.findMany({
      where: {
        taskId: { in: taskIds },
        userId,
      },
      select: { taskId: true },
    });

    return new Set(owned.map((item) => item.taskId));
  }

  async getTasksForProject(taskIds: string[], projectId: string, organizationId: string) {
    return this.prisma.task.findMany({
      where: {
        id: { in: taskIds },
        projectId,
        deletedAt: null,
        project: { organizationId },
      },
      include: taskInclude,
    });
  }

  async getCriticalDependencies(sprintId: string) {
    return this.prisma.taskDependency.findMany({
      where: {
        critical: true,
        blocked: {
          sprintId,
        },
      },
      include: {
        blocker: {
          select: {
            id: true,
            title: true,
            state: true,
          },
        },
        blocked: {
          select: {
            id: true,
            title: true,
            state: true,
          },
        },
      },
    });
  }

  async withTransaction<T>(callback: (tx: Prisma.TransactionClient) => Promise<T>) {
    return this.prisma.$transaction(callback);
  }

  async listActiveSprintsForSnapshots() {
    return this.prisma.sprint.findMany({
      where: {
        status: 'ACTIVE',
      },
      include: sprintInclude,
    });
  }

  async listProjectTaskAssignees(projectId: string, organizationId: string) {
    return this.prisma.taskAssignee.findMany({
      where: {
        task: {
          projectId,
          project: { organizationId },
        },
      },
      select: {
        taskId: true,
        userId: true,
      },
    });
  }

  async getRoleCapabilities(projectId: string, organizationId: string, role: Role) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, organizationId },
      select: { id: true },
    });

    if (!project) {
      throw new NotFoundException('Projeto não encontrado');
    }

    return { projectId: project.id, role };
  }

  async findTaskById(taskId: string, organizationId: string) {
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        deletedAt: null,
        project: { organizationId },
      },
      include: taskInclude,
    });

    if (!task) {
      throw new NotFoundException('Task não encontrada');
    }

    return task;
  }

  async ensureProjectTask(taskId: string, projectId: string, organizationId: string) {
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        projectId,
        deletedAt: null,
        project: { organizationId },
      },
      include: taskInclude,
    });

    if (!task) {
      throw new NotFoundException('Task não encontrada para o projeto informado');
    }

    return task;
  }

  async listSprintHistory(sprintId: string, organizationId: string) {
    const sprint = await this.getSprintOrThrow(sprintId, organizationId);
    return sprint.auditLogs;
  }

  async listSprintMetrics(sprintId: string, organizationId: string) {
    const sprint = await this.getSprintOrThrow(sprintId, organizationId);
    return sprint.metrics;
  }

  async listBurndown(sprintId: string, organizationId: string) {
    const sprint = await this.getSprintOrThrow(sprintId, organizationId);
    return sprint.snapshots;
  }

  async findTaskByProjectState(projectId: string) {
    return this.prisma.task.groupBy({
      by: ['state'],
      where: { projectId },
      _count: { _all: true },
    });
  }

  async getProjectBacklogCount(projectId: string) {
    return this.prisma.task.count({
      where: {
        projectId,
        sprintId: null,
        deletedAt: null,
        state: { not: TaskState.DONE },
      },
    });
  }
}
