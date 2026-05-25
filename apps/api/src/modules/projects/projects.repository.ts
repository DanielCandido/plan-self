import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProjectsRepository {
  constructor(public readonly prisma: PrismaService) {}

  async listProjects(organizationId: string, options: { page: number; perPage: number; search?: string; teamId?: string }) {
    const where: any = { organizationId };

    if (options.teamId) where.teamId = options.teamId;
    if (options.search && options.search.trim()) {
      where.name = { contains: options.search.trim(), mode: 'insensitive' };
    }

    const [items, totalCount] = await Promise.all([
      this.prisma.project.findMany({
        where,
        include: {
          team: { select: { id: true, name: true } },
        },
        skip: options.page * options.perPage,
        take: options.perPage,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.project.count({ where }),
    ]);

    const projectIds = items.map((p) => p.id);

    const totals = projectIds.length
      ? await this.prisma.task.groupBy({ by: ['projectId'], where: { projectId: { in: projectIds } }, _count: { _all: true } })
      : [];

    const completed = projectIds.length
      ? await this.prisma.task.groupBy({ by: ['projectId'], where: { projectId: { in: projectIds }, state: 'DONE' }, _count: { _all: true } })
      : [];

    const totalsById = new Map(totals.map((t) => [t.projectId, t._count._all]));
    const doneById = new Map(completed.map((t) => [t.projectId, t._count._all]));

    const hydrated = items.map((p) => {
      const total = totalsById.get(p.id) ?? 0;
      const done = doneById.get(p.id) ?? 0;
      const progress = total === 0 ? 0 : Math.round((done / total) * 100);
      return { ...p, meta: { taskCount: total, completedTaskCount: done, progress } };
    });

    return { items: hydrated, totalCount };
  }

  async getCounts(organizationId: string) {
    const total = await this.prisma.project.count({ where: { organizationId } });

    // projects with any open tasks (not done)
    const withBacklog = (
      await this.prisma.task.groupBy({ by: ['projectId'], where: { project: { organizationId }, state: { not: 'DONE' } }, _count: { _all: true } })
    ).length;

    // projects where all tasks are done and at least one task exists
    const completedProjectIds = (
      await this.prisma.task.groupBy({ by: ['projectId'], where: { project: { organizationId }, state: 'DONE' }, _count: { _all: true } })
    ).map((r) => r.projectId);

    const projectIdsWithTasks = (
      await this.prisma.task.groupBy({ by: ['projectId'], where: { project: { organizationId } }, _count: { _all: true } })
    ).map((r) => r.projectId);

    const completed = completedProjectIds.filter((id) => projectIdsWithTasks.includes(id)).length;

    return { total, withBacklog, completed };
  }

  async createProject(organizationId: string, data: { name: string; description?: string; teamId?: string; ownerId?: string; priority?: string; color?: string; status?: string }) {
    const project = await this.prisma.project.create({
      data: { ...data, organizationId },
    });

    return project;
  }

  async updateProject(projectId: string, organizationId: string, data: any) {
    const existing = await this.prisma.project.findFirst({ where: { id: projectId, organizationId } });
    if (!existing) {
      throw new Error('Projeto não encontrado');
    }

    const updated = await this.prisma.project.update({ where: { id: projectId }, data });
    return updated;
  }

  async setArchived(projectId: string, organizationId: string, archived: boolean) {
    const existing = await this.prisma.project.findFirst({ where: { id: projectId, organizationId } });
    if (!existing) {
      throw new Error('Projeto não encontrado');
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
}
