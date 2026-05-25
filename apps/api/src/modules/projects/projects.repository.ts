import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role, TaskState } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProjectsRepository {
  constructor(public readonly prisma: PrismaService) {}

  async listProjects(
    organizationId: string,
    options: {
      page: number;
      perPage: number;
      search?: string;
      teamId?: string;
      ownerId?: string;
      status?: string;
      priority?: string;
      sortBy?: string;
      order?: Prisma.SortOrder;
    },
  ) {
    const where: Prisma.ProjectWhereInput = { organizationId, archived: false };

    if (options.teamId) where.teamId = options.teamId;
    if (options.ownerId) where.ownerId = options.ownerId;
    if (options.status) where.status = options.status;
    if (options.priority) where.priority = options.priority;
    if (options.search && options.search.trim()) {
      where.OR = [
        { name: { contains: options.search.trim(), mode: 'insensitive' } },
        { description: { contains: options.search.trim(), mode: 'insensitive' } },
      ];
    }

    const orderBy = this.resolveProjectOrderBy(options.sortBy, options.order);

    const [items, totalCount] = await Promise.all([
      this.prisma.project.findMany({
        where,
        include: {
          team: { select: { id: true, name: true } },
          owner: { select: { id: true, name: true, avatarUrl: true } },
        },
        skip: options.page * options.perPage,
        take: options.perPage,
        orderBy,
      }),
      this.prisma.project.count({ where }),
    ]);

    const hydrated = await this.hydrateProjects(items);

    return { items: hydrated, totalCount };
  }

  async findById(projectId: string, organizationId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, organizationId },
      include: {
        team: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    if (!project) {
      throw new NotFoundException('Projeto não encontrado');
    }

    const [hydrated] = await this.hydrateProjects([project]);
    return hydrated;
  }

  async getCounts(organizationId: string) {
    const total = await this.prisma.project.count({ where: { organizationId, archived: false } });

    // projects with any open tasks (not done)
    const withBacklog = (
      await this.prisma.task.groupBy({
        by: ['projectId'],
        where: { project: { organizationId, archived: false }, state: { not: 'DONE' } },
        _count: { _all: true },
      })
    ).length;

    // projects where all tasks are done and at least one task exists
    const completedProjectIds = (
      await this.prisma.task.groupBy({
        by: ['projectId'],
        where: { project: { organizationId, archived: false }, state: 'DONE' },
        _count: { _all: true },
      })
    ).map((r) => r.projectId);

    const projectIdsWithTasks = (
      await this.prisma.task.groupBy({
        by: ['projectId'],
        where: { project: { organizationId, archived: false } },
        _count: { _all: true },
      })
    ).map((r) => r.projectId);

    const completed = completedProjectIds.filter((id) => projectIdsWithTasks.includes(id)).length;

    return { total, withBacklog, completed };
  }

  async createProject(organizationId: string, data: { name: string; description?: string; teamId?: string; ownerId?: string; priority?: string; color?: string; status?: string }) {
    const project = await this.prisma.project.create({
      data: { ...data, organizationId },
      include: {
        team: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    const [hydrated] = await this.hydrateProjects([project]);
    return hydrated;
  }

  async updateProject(projectId: string, organizationId: string, data: any) {
    const existing = await this.prisma.project.findFirst({ where: { id: projectId, organizationId } });
    if (!existing) {
      throw new NotFoundException('Projeto não encontrado');
    }

    const updated = await this.prisma.project.update({
      where: { id: projectId },
      data,
      include: {
        team: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
    const [hydrated] = await this.hydrateProjects([updated]);
    return hydrated;
  }

  async setArchived(projectId: string, organizationId: string, archived: boolean) {
    const existing = await this.prisma.project.findFirst({ where: { id: projectId, organizationId } });
    if (!existing) {
      throw new NotFoundException('Projeto não encontrado');
    }

    const updated = await this.prisma.project.update({ where: { id: projectId }, data: { archived } });
    return updated;
  }

  async computeProgress(projectId: string, organizationId: string) {
    const total = await this.prisma.task.count({ where: { projectId, project: { organizationId } } });
    if (total === 0) return 0;
    const done = await this.prisma.task.count({ where: { projectId, state: 'DONE', project: { organizationId } } });
    return Math.round((done / total) * 100);
  }

  async listProjectMembers(projectId: string, organizationId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, organizationId },
      select: { teamId: true },
    });

    if (!project) {
      throw new NotFoundException('Projeto não encontrado');
    }

    if (!project.teamId) return [];

    const members = await this.prisma.teamMember.findMany({
      where: { teamId: project.teamId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        user: { name: 'asc' },
      },
    });

    return members.map((member) => ({
      userId: member.user.id,
      name: member.user.name,
      avatarUrl: member.user.avatarUrl,
      role: member.role,
    }));
  }

  async addProjectMember(projectId: string, organizationId: string, data: { userId: string; role?: string }) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, organizationId },
      select: { teamId: true },
    });

    if (!project) {
      throw new NotFoundException('Projeto não encontrado');
    }

    if (!project.teamId) {
      throw new NotFoundException('Projeto sem equipe vinculada');
    }

    const user = await this.prisma.user.findFirst({
      where: { id: data.userId, organizationId, status: 'ACTIVE' },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    await this.prisma.teamMember.upsert({
      where: {
        teamId_userId: {
          teamId: project.teamId,
          userId: data.userId,
        },
      },
      update: {
        role: this.resolveRole(data.role),
      },
      create: {
        teamId: project.teamId,
        userId: data.userId,
        role: this.resolveRole(data.role),
      },
    });

    return this.listProjectMembers(projectId, organizationId);
  }

  async removeProjectMember(projectId: string, organizationId: string, userId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, organizationId },
      select: { teamId: true },
    });

    if (!project) {
      throw new NotFoundException('Projeto não encontrado');
    }

    if (!project.teamId) {
      throw new NotFoundException('Projeto sem equipe vinculada');
    }

    await this.prisma.teamMember.deleteMany({
      where: { teamId: project.teamId, userId },
    });

    return this.listProjectMembers(projectId, organizationId);
  }

  async listAvailableProjectUsers(projectId: string, organizationId: string, search?: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, organizationId },
      select: { id: true, teamId: true },
    });

    if (!project) {
      throw new NotFoundException('Projeto não encontrado');
    }

    const existingMembers = project.teamId
      ? await this.prisma.teamMember.findMany({
          where: { teamId: project.teamId },
          select: { userId: true },
        })
      : [];

    const memberIds = new Set(existingMembers.map((member) => member.userId));

    const users = await this.prisma.user.findMany({
      where: {
        organizationId,
        status: 'ACTIVE',
        ...(search?.trim()
          ? {
              name: {
                contains: search.trim(),
                mode: 'insensitive',
              },
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        role: true,
      },
      orderBy: {
        name: 'asc',
      },
      take: 50,
    });

    return users.map((user) => ({
      userId: user.id,
      name: user.name,
      avatarUrl: user.avatarUrl,
      role: user.role,
      isMember: memberIds.has(user.id),
    }));
  }

  async listProjectTasks(
    projectId: string,
    organizationId: string,
    options: {
      page: number;
      perPage: number;
      search?: string;
      state?: string;
      priority?: string;
      assigneeId?: string;
    },
  ) {
    const where: Prisma.TaskWhereInput = {
      projectId,
      project: { organizationId },
      ...(options.search?.trim()
        ? {
            OR: [
              { title: { contains: options.search.trim(), mode: 'insensitive' } },
              { description: { contains: options.search.trim(), mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(options.state ? { state: options.state as TaskState } : {}),
      ...(options.priority ? { priority: options.priority } : {}),
      ...(options.assigneeId ? { assignees: { some: { userId: options.assigneeId } } } : {}),
    };

    const [items, totalCount] = await Promise.all([
      this.prisma.task.findMany({
        where,
        include: {
          assignees: {
            include: {
              user: {
                select: { id: true, name: true, avatarUrl: true },
              },
            },
          },
        },
        skip: options.page * options.perPage,
        take: options.perPage,
        orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      items: items.map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        state: task.state,
        priority: task.priority,
        storyPoints: task.storyPoints,
        dueAt: task.dueAt?.toISOString() ?? null,
        sprintId: task.sprintId,
        updatedAt: task.updatedAt.toISOString(),
        assignees: task.assignees.map((assignee) => ({
          id: assignee.user.id,
          name: assignee.user.name,
          avatarUrl: assignee.user.avatarUrl,
        })),
      })),
      totalCount,
    };
  }

  async createProjectTask(
    projectId: string,
    organizationId: string,
    data: {
      title: string;
      description?: string;
      priority?: string;
      storyPoints?: number;
      dueAt?: string;
      assigneeIds?: string[];
    },
  ) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, organizationId },
      select: { id: true },
    });

    if (!project) {
      throw new NotFoundException('Projeto não encontrado');
    }

    const task = await this.prisma.task.create({
      data: {
        projectId: project.id,
        title: data.title,
        description: data.description,
        priority: data.priority ?? 'MEDIUM',
        storyPoints: data.storyPoints,
        dueAt: data.dueAt ? new Date(data.dueAt) : null,
        assignees: data.assigneeIds?.length
          ? {
              createMany: {
                data: data.assigneeIds.map((userId) => ({ userId })),
                skipDuplicates: true,
              },
            }
          : undefined,
      },
      include: {
        assignees: {
          include: {
            user: {
              select: { id: true, name: true, avatarUrl: true },
            },
          },
        },
      },
    });

    return {
      id: task.id,
      title: task.title,
      description: task.description,
      state: task.state,
      priority: task.priority,
      storyPoints: task.storyPoints,
      dueAt: task.dueAt?.toISOString() ?? null,
      sprintId: task.sprintId,
      updatedAt: task.updatedAt.toISOString(),
      assignees: task.assignees.map((assignee) => ({
        id: assignee.user.id,
        name: assignee.user.name,
        avatarUrl: assignee.user.avatarUrl,
      })),
    };
  }

  private async hydrateProjects<T extends Array<{ id: string }>>(items: T) {
    const projectIds = items.map((p) => p.id);

    const totals = projectIds.length
      ? await this.prisma.task.groupBy({
          by: ['projectId'],
          where: { projectId: { in: projectIds } },
          _count: { _all: true },
        })
      : [];

    const completed = projectIds.length
      ? await this.prisma.task.groupBy({
          by: ['projectId'],
          where: { projectId: { in: projectIds }, state: 'DONE' },
          _count: { _all: true },
        })
      : [];

    const totalsById = new Map(totals.map((t) => [t.projectId, t._count._all]));
    const doneById = new Map(completed.map((t) => [t.projectId, t._count._all]));

    return items.map((p) => {
      const total = totalsById.get(p.id) ?? 0;
      const done = doneById.get(p.id) ?? 0;
      const progress = total === 0 ? 0 : Math.round((done / total) * 100);
      return { ...p, meta: { taskCount: total, completedTaskCount: done, progress } };
    });
  }

  private resolveProjectOrderBy(sortBy?: string, order?: Prisma.SortOrder): Prisma.ProjectOrderByWithRelationInput {
    const safeOrder = order ?? 'desc';
    const map: Record<string, Prisma.ProjectOrderByWithRelationInput> = {
      name: { name: safeOrder },
      createdAt: { createdAt: safeOrder },
      priority: { priority: safeOrder },
      updatedAt: { updatedAt: safeOrder },
    };

    return map[sortBy ?? 'updatedAt'] ?? map.updatedAt;
  }

  private resolveRole(role?: string): Role {
    if (!role) return 'MEMBER';
    const normalized = role.toUpperCase();
    const validRoles: Role[] = ['OWNER', 'ADMIN', 'MANAGER', 'MEMBER', 'GUEST'];
    if (!validRoles.includes(normalized as Role)) {
      throw new BadRequestException('Role inválida para membro do projeto');
    }
    return normalized as Role;
  }
}
