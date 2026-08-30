import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BoardColumnType, Prisma, ProjectMemberRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const PROJECT_ORDER_FIELDS = ['name', 'createdAt', 'priority', 'updatedAt'] as const;
type ProjectOrderField = (typeof PROJECT_ORDER_FIELDS)[number];

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
        where: {
          project: { organizationId, archived: false },
          OR: [{ boardColumn: null }, { boardColumn: { type: { not: 'DONE' } } }],
        },
        _count: { _all: true },
      })
    ).length;

    // projects where all tasks are done and at least one task exists
    const completedProjectIds = (
      await this.prisma.task.groupBy({
        by: ['projectId'],
        where: { project: { organizationId, archived: false }, boardColumn: { type: 'DONE' } },
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

  async listProjectOwnerOptions(organizationId: string, search = '', limit = 25) {
    const searchTerm = search.trim();
    const owners = await this.prisma.user.findMany({
      where: {
        organizationId,
        status: 'ACTIVE',
        ...(searchTerm
          ? {
              name: {
                contains: searchTerm,
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
      orderBy: { name: 'asc' },
      take: limit,
    });

    return owners.map((owner) => ({
      id: owner.id,
      name: owner.name,
      avatarUrl: owner.avatarUrl,
      role: owner.role,
    }));
  }

  async listProjectTeamOptions(organizationId: string, search = '', limit = 25) {
    const searchTerm = search.trim();
    const teams = await this.prisma.team.findMany({
      where: {
        organizationId,
        ...(searchTerm
          ? {
              name: {
                contains: searchTerm,
                mode: 'insensitive',
              },
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: 'asc' },
      take: limit,
    });

    return teams.map((team) => ({
      id: team.id,
      name: team.name,
    }));
  }

  async createProject(organizationId: string, data: { name: string; description?: string; teamId?: string; ownerId?: string; priority?: string; color?: string; status?: string; profile?: 'GENERAL' | 'CONSTRUCTION_SITE' }) {
    const project = await this.prisma.project.create({
      data: { ...data, organizationId },
      include: {
        team: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    if (project.ownerId) {
      await this.prisma.projectMember.create({
        data: { projectId: project.id, userId: project.ownerId, role: 'OWNER' },
      });
    }

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
    const done = await this.prisma.task.count({
      where: { projectId, boardColumn: { type: 'DONE' }, project: { organizationId } },
    });
    return Math.round((done / total) * 100);
  }

  async listProjectMembers(projectId: string, organizationId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, organizationId },
      select: { id: true },
    });

    if (!project) {
      throw new NotFoundException('Projeto não encontrado');
    }

    const members = await this.prisma.projectMember.findMany({
      where: { projectId: project.id },
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
      select: { id: true },
    });

    if (!project) {
      throw new NotFoundException('Projeto não encontrado');
    }

    const user = await this.prisma.user.findFirst({
      where: { id: data.userId, organizationId, status: 'ACTIVE' },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    await this.prisma.projectMember.upsert({
      where: {
        projectId_userId: {
          projectId: project.id,
          userId: data.userId,
        },
      },
      update: {
        role: this.resolveProjectRole(data.role),
      },
      create: {
        projectId: project.id,
        userId: data.userId,
        role: this.resolveProjectRole(data.role),
      },
    });

    return this.listProjectMembers(projectId, organizationId);
  }

  async removeProjectMember(projectId: string, organizationId: string, userId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, organizationId },
      select: { id: true, ownerId: true },
    });

    if (!project) {
      throw new NotFoundException('Projeto não encontrado');
    }

    if (project.ownerId === userId) {
      throw new BadRequestException('O proprietario do projeto nao pode ser removido');
    }

    await this.prisma.projectMember.deleteMany({
      where: { projectId: project.id, userId },
    });

    return this.listProjectMembers(projectId, organizationId);
  }

  async listAvailableProjectUsers(projectId: string, organizationId: string, search?: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, organizationId },
      select: { id: true },
    });

    if (!project) {
      throw new NotFoundException('Projeto não encontrado');
    }

    const existingMembers = await this.prisma.projectMember.findMany({
      where: { projectId: project.id },
      select: { userId: true },
    });

    const memberIds = new Set(existingMembers.map((member) => member.userId));

    const searchTerm = search?.trim();

    const users = await this.prisma.user.findMany({
      where: {
        organizationId,
        status: 'ACTIVE',
        ...(searchTerm
          ? {
              name: {
                contains: searchTerm,
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
      ...(options.state ? { boardColumn: { type: options.state as BoardColumnType } } : {}),
      ...(options.priority ? { priority: options.priority } : {}),
      ...(options.assigneeId ? { assignees: { some: { userId: options.assigneeId } } } : {}),
    };

    const [items, totalCount] = await Promise.all([
      this.prisma.task.findMany({
        where,
        include: {
          boardColumn: {
            select: {
              id: true,
              type: true,
            },
          },
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
        state: task.boardColumn?.type ?? 'BACKLOG',
        boardColumnId: task.boardColumnId,
        boardColumnType: task.boardColumn?.type ?? null,
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

    const backlogColumn = await this.prisma.boardColumn.findFirst({
      where: {
        board: { projectId: project.id },
        type: 'BACKLOG',
      },
      select: { id: true, boardId: true },
    });

    const task = await this.prisma.task.create({
      data: {
        projectId: project.id,
        boardId: backlogColumn?.boardId ?? null,
        boardColumnId: backlogColumn?.id ?? null,
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
        boardColumn: {
          select: {
            type: true,
          },
        },
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
      state: task.boardColumn?.type ?? 'BACKLOG',
      boardColumnId: task.boardColumnId,
      boardColumnType: task.boardColumn?.type ?? null,
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
          where: { projectId: { in: projectIds }, boardColumn: { type: 'DONE' } },
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

  async listWbs(projectId: string, organizationId: string) {
    await this.assertProject(projectId, organizationId);
    return this.prisma.wbsNode.findMany({ where: { projectId }, include: { _count: { select: { tasks: true, children: true } } }, orderBy: [{ position: 'asc' }, { code: 'asc' }] });
  }

  async getTimeline(projectId: string, organizationId: string) {
    await this.assertProject(projectId, organizationId);
    const [wbs, tasks, dependencies] = await Promise.all([
      this.prisma.wbsNode.findMany({ where: { projectId }, orderBy: [{ position: 'asc' }, { code: 'asc' }] }),
      this.prisma.task.findMany({
        where: { projectId, deletedAt: null },
        select: { id: true, code: true, title: true, wbsNodeId: true, plannedStart: true, plannedEnd: true, dueAt: true, blocked: true, boardColumn: { select: { type: true } } },
        orderBy: [{ plannedStart: 'asc' }, { title: 'asc' }],
      }),
      this.prisma.taskDependency.findMany({ where: { blocker: { projectId }, blocked: { projectId } } }),
    ]);
    return {
      wbs,
      tasks: tasks.map((task) => ({ ...task, state: task.boardColumn?.type ?? 'BACKLOG', boardColumn: undefined, plannedStart: task.plannedStart?.toISOString() ?? null, plannedEnd: (task.plannedEnd ?? task.dueAt)?.toISOString() ?? null })),
      dependencies,
    };
  }

  async createWbsNode(projectId: string, organizationId: string, data: any) {
    await this.assertProject(projectId, organizationId);
    if (data.parentId && !(await this.prisma.wbsNode.findFirst({ where: { id: data.parentId, projectId } }))) throw new BadRequestException('Item pai da EAP invalido');
    return this.prisma.wbsNode.create({ data: { projectId, parentId: data.parentId, code: data.code, name: data.name, description: data.description, type: data.type, position: data.position ?? 0 } });
  }

  async updateWbsNode(projectId: string, nodeId: string, organizationId: string, data: any) {
    await this.assertProject(projectId, organizationId);
    if (data.parentId === nodeId) throw new BadRequestException('Um item da EAP nao pode ser pai de si mesmo');
    if (!(await this.prisma.wbsNode.findFirst({ where: { id: nodeId, projectId } }))) throw new NotFoundException('Item da EAP nao encontrado');
    return this.prisma.wbsNode.update({ where: { id: nodeId }, data });
  }

  async removeWbsNode(projectId: string, nodeId: string, organizationId: string) {
    await this.assertProject(projectId, organizationId);
    const result = await this.prisma.wbsNode.deleteMany({ where: { id: nodeId, projectId } });
    if (!result.count) throw new NotFoundException('Item da EAP nao encontrado');
    return { deleted: true };
  }

  async createDependency(projectId: string, organizationId: string, data: any) {
    await this.assertProject(projectId, organizationId);
    if (data.blockerTaskId === data.blockedTaskId) throw new BadRequestException('Uma tarefa nao pode depender de si mesma');
    const tasks = await this.prisma.task.count({ where: { id: { in: [data.blockerTaskId, data.blockedTaskId] }, projectId } });
    if (tasks !== 2) throw new BadRequestException('As tarefas devem pertencer ao projeto');
    const reverse = await this.prisma.taskDependency.findUnique({ where: { blockerTaskId_blockedTaskId: { blockerTaskId: data.blockedTaskId, blockedTaskId: data.blockerTaskId } } });
    if (reverse) throw new BadRequestException('A dependencia criaria um ciclo direto');
    return this.prisma.taskDependency.create({ data: { blockerTaskId: data.blockerTaskId, blockedTaskId: data.blockedTaskId, type: data.type, lagDays: data.lagDays ?? 0, critical: data.critical ?? false } });
  }

  async removeDependency(projectId: string, dependencyId: string, organizationId: string) {
    await this.assertProject(projectId, organizationId);
    const result = await this.prisma.taskDependency.deleteMany({ where: { id: dependencyId, blocker: { projectId }, blocked: { projectId } } });
    if (!result.count) throw new NotFoundException('Dependencia nao encontrada');
    return { deleted: true };
  }

  private async assertProject(projectId: string, organizationId: string) {
    if (!(await this.prisma.project.findFirst({ where: { id: projectId, organizationId }, select: { id: true } }))) throw new NotFoundException('Projeto nao encontrado');
  }

  private resolveProjectOrderBy(sortBy?: string, order?: Prisma.SortOrder): Prisma.ProjectOrderByWithRelationInput {
    const safeOrder = order ?? 'desc';
    const map: Record<ProjectOrderField, Prisma.ProjectOrderByWithRelationInput> = {
      name: { name: safeOrder },
      createdAt: { createdAt: safeOrder },
      priority: { priority: safeOrder },
      updatedAt: { updatedAt: safeOrder },
    };

    const key = PROJECT_ORDER_FIELDS.includes((sortBy ?? 'updatedAt') as ProjectOrderField)
      ? ((sortBy ?? 'updatedAt') as ProjectOrderField)
      : 'updatedAt';

    return map[key];
  }

  async updateProjectMember(projectId: string, organizationId: string, userId: string, data: { role?: string }) {
    const project = await this.prisma.project.findFirst({ where: { id: projectId, organizationId } });
    if (!project) throw new NotFoundException('Projeto nao encontrado');
    await this.prisma.projectMember.update({
      where: { projectId_userId: { projectId, userId } },
      data: { role: this.resolveProjectRole(data.role) },
    });
    return this.listProjectMembers(projectId, organizationId);
  }

  private resolveProjectRole(role?: string): ProjectMemberRole {
    if (!role) return 'CONTRIBUTOR';
    const normalized = role.toUpperCase();
    const validRoles: ProjectMemberRole[] = ['OWNER', 'MANAGER', 'CONTRIBUTOR', 'VIEWER'];
    if (!validRoles.includes(normalized as ProjectMemberRole)) {
      throw new BadRequestException('Role inválida para membro do projeto');
    }
    return normalized as ProjectMemberRole;
  }
}
