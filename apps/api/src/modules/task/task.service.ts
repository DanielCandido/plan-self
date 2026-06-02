import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BoardColumnType, Prisma, TaskHistoryAction, TaskState } from '@prisma/client';
import type { CurrentUserPayload } from '../auth/types/current-user.type';
import { PrismaService } from '../prisma/prisma.service';
import { SprintGateway } from '../sprints/sprint.gateway';
import type { CreateTaskCommentDto } from './dto/create-task-comment.dto';
import type { CreateTaskDto } from './dto/create-task.dto';
import type { CreateLabelDto, LabelQueryDto } from './dto/task-label.dto';
import type { TaskQueryDto } from './dto/task-query.dto';
import type { UpdateTaskRestDto } from './dto/update-task.dto';

const taskInclude = {
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
  comments: {
    include: {
      author: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' as const },
  },
  boardColumn: {
    select: {
      id: true,
      boardId: true,
      name: true,
      type: true,
    },
  },
  sprint: {
    select: {
      id: true,
      name: true,
    },
  },
  history: {
    include: {
      actor: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' as const },
    take: 30,
  },
} satisfies Prisma.TaskInclude;

type TaskWithRelations = Prisma.TaskGetPayload<{ include: typeof taskInclude }>;
const OPTIMISTIC_LOCK_TOLERANCE_MS = 1_000;
const MAX_CODE_GENERATION_ATTEMPTS = 5;
const DEFAULT_BOARD_COLUMNS: Array<{
  name: string;
  type: BoardColumnType;
  order: number;
  wipLimit: number | null;
}> = [
  { name: 'Backlog', type: 'BACKLOG', order: 0, wipLimit: null },
  { name: 'Todo', type: 'TODO', order: 1, wipLimit: null },
  { name: 'In Progress', type: 'IN_PROGRESS', order: 2, wipLimit: 6 },
  { name: 'Review', type: 'REVIEW', order: 3, wipLimit: 5 },
  { name: 'Done', type: 'DONE', order: 4, wipLimit: null },
  { name: 'Blocked', type: 'BLOCKED', order: 5, wipLimit: 4 },
];

@Injectable()
export class TaskService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sprintGateway: SprintGateway,
  ) {}

  async listTasks(currentUser: CurrentUserPayload, query: TaskQueryDto) {
    await this.assertProjectScope(query.projectId, currentUser.organizationId);

    const tasks = await this.prisma.task.findMany({
      where: {
        projectId: query.projectId,
        ...(query.sprintId ? { sprintId: query.sprintId } : {}),
        ...(query.boardColumnId ? { boardColumnId: query.boardColumnId } : {}),
        ...(query.includeDeleted ? {} : { deletedAt: null }),
        ...(query.search?.trim()
          ? {
              OR: [
                { title: { contains: query.search.trim(), mode: 'insensitive' } },
                { description: { contains: query.search.trim(), mode: 'insensitive' } },
                { code: { contains: query.search.trim(), mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: taskInclude,
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
      take: query.limit,
    });

    return tasks.map((task) => this.mapTask(task));
  }

  async getTask(currentUser: CurrentUserPayload, taskId: string) {
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        project: { organizationId: currentUser.organizationId },
      },
      include: taskInclude,
    });

    if (!task) {
      throw new NotFoundException('Task não encontrada');
    }

    return this.mapTask(task);
  }

  async createTask(currentUser: CurrentUserPayload, dto: CreateTaskDto) {
    const project = await this.assertProjectScope(dto.projectId, currentUser.organizationId);
    const boardColumn = await this.resolveBoardColumn(dto.projectId, dto.boardColumnId);
    const position = dto.position ?? (await this.nextTaskPosition(dto.projectId, boardColumn.id));

    const task = await this.createTaskWithUniqueCode({
      projectId: dto.projectId,
      boardId: boardColumn.boardId ?? project.board?.id ?? null,
      boardColumnId: boardColumn.id,
      sprintId: dto.sprintId,
      code: dto.code ?? this.generateTaskCode(),
      title: dto.title,
      description: dto.description,
      position,
      sortOrder: position,
      priority: dto.priority ?? 'MEDIUM',
      points: dto.points,
      storyPoints: dto.points,
      blocked: dto.blocked ?? Boolean(dto.blockedReason),
      blockedReason: dto.blockedReason,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      dueAt: dto.dueDate ? new Date(dto.dueDate) : null,
      labels: this.serializeLabels(dto.labels),
      createdBy: currentUser.id,
      updatedBy: currentUser.id,
    });

    if (dto.assigneeIds && dto.assigneeIds.length > 0) {
      await this.prisma.taskAssignee.createMany({
        data: dto.assigneeIds.map((userId) => ({ taskId: task.id, userId })),
        skipDuplicates: true,
      });
    }

    await this.persistLabelCatalog(currentUser, dto.projectId, dto.labels ?? []);
    await this.writeTaskHistory(task.id, currentUser.id, TaskHistoryAction.CREATED, {
      toStatus: this.columnTypeToState(task.boardColumn?.type),
      toColumnId: task.boardColumnId,
    });

    if (task.sprintId) {
      this.sprintGateway.emitProjectEvent(task.projectId, 'sprint.updated', {
        projectId: task.projectId,
        sprintId: task.sprintId,
        taskId: task.id,
        reason: 'task.created',
        at: new Date().toISOString(),
      });
    } else {
      this.sprintGateway.emitProjectEvent(task.projectId, 'backlog.updated', {
        projectId: task.projectId,
        taskId: task.id,
        reason: 'task.created',
        at: new Date().toISOString(),
      });
    }

    return this.mapTask(task);
  }

  async updateTask(currentUser: CurrentUserPayload, taskId: string, dto: UpdateTaskRestDto) {
    const current = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        project: { organizationId: currentUser.organizationId },
      },
      include: taskInclude,
    });

    if (!current) {
      throw new NotFoundException('Task não encontrada');
    }

    if (current.deletedAt) {
      throw new BadRequestException('Task excluída não pode ser alterada');
    }

    if (dto.updatedAt) {
      const requestUpdatedAt = new Date(dto.updatedAt).getTime();
      const currentUpdatedAt = current.updatedAt.getTime();
      if (Math.abs(requestUpdatedAt - currentUpdatedAt) > OPTIMISTIC_LOCK_TOLERANCE_MS) {
        throw new ConflictException('Task foi alterada por outro usuário');
      }
    }

    const targetColumn =
      dto.boardColumnId === undefined
        ? current.boardColumn
        : await this.resolveBoardColumn(current.projectId, dto.boardColumnId);

    if (
      current.boardColumn?.type === 'DONE' &&
      targetColumn?.type !== 'DONE' &&
      !['OWNER', 'ADMIN'].includes(currentUser.role)
    ) {
      throw new ForbiddenException('Apenas Owner/Admin podem reabrir tasks DONE');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      if (dto.assigneeIds) {
        await tx.taskAssignee.deleteMany({ where: { taskId: current.id } });
        if (dto.assigneeIds.length > 0) {
          await tx.taskAssignee.createMany({
            data: dto.assigneeIds.map((userId) => ({ taskId: current.id, userId })),
            skipDuplicates: true,
          });
        }
      }

      if (dto.labels) {
        await this.persistLabelCatalog(currentUser, current.projectId, dto.labels, tx);
      }

      return tx.task.update({
        where: { id: current.id },
        data: {
          title: dto.title,
          description: dto.description,
          priority: dto.priority,
          position: dto.position,
          sortOrder: dto.position,
          points: dto.points,
          storyPoints: dto.points,
          blocked: dto.blocked,
          blockedReason: dto.blockedReason === undefined ? undefined : dto.blockedReason,
          dueDate: dto.dueDate === undefined ? undefined : dto.dueDate ? new Date(dto.dueDate) : null,
          dueAt: dto.dueDate === undefined ? undefined : dto.dueDate ? new Date(dto.dueDate) : null,
          boardId: targetColumn?.boardId ?? undefined,
          boardColumnId: targetColumn?.id ?? undefined,
          updatedBy: currentUser.id,
          labels: this.serializeLabels(dto.labels),
          checklist:
            dto.checklist === undefined
              ? undefined
              : (dto.checklist as unknown as Prisma.InputJsonValue),
        },
        include: taskInclude,
      });
    });

    await this.writeTaskHistory(updated.id, currentUser.id, TaskHistoryAction.UPDATED, {
      fromStatus: this.columnTypeToState(current.boardColumn?.type),
      toStatus: this.columnTypeToState(updated.boardColumn?.type),
      fromColumnId: current.boardColumnId,
      toColumnId: updated.boardColumnId,
    });

    this.sprintGateway.emitProjectEvent(updated.projectId, 'backlog.updated', {
      projectId: updated.projectId,
      sprintId: updated.sprintId,
      taskId: updated.id,
      reason: 'task.updated',
      at: new Date().toISOString(),
    });

    if (updated.sprintId) {
      this.sprintGateway.emitProjectEvent(updated.projectId, 'sprint.updated', {
        projectId: updated.projectId,
        sprintId: updated.sprintId,
        taskId: updated.id,
        reason: 'task.updated',
        at: new Date().toISOString(),
      });
    }

    return this.mapTask(updated);
  }

  async deleteTask(currentUser: CurrentUserPayload, taskId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, project: { organizationId: currentUser.organizationId } },
      select: { id: true, projectId: true, sprintId: true, deletedAt: true },
    });

    if (!task) {
      throw new NotFoundException('Task não encontrada');
    }

    if (task.deletedAt) {
      return { ok: true };
    }

    await this.prisma.task.update({
      where: { id: task.id },
      data: {
        deletedAt: new Date(),
        updatedBy: currentUser.id,
      },
    });

    await this.writeTaskHistory(task.id, currentUser.id, TaskHistoryAction.DELETED, {});

    this.sprintGateway.emitProjectEvent(task.projectId, 'backlog.updated', {
      projectId: task.projectId,
      sprintId: task.sprintId,
      taskId: task.id,
      reason: 'task.deleted',
      at: new Date().toISOString(),
    });

    if (task.sprintId) {
      this.sprintGateway.emitProjectEvent(task.projectId, 'sprint.updated', {
        projectId: task.projectId,
        sprintId: task.sprintId,
        taskId: task.id,
        reason: 'task.deleted',
        at: new Date().toISOString(),
      });
    }

    return { ok: true };
  }

  async listTaskComments(currentUser: CurrentUserPayload, taskId: string) {
    await this.assertTaskScope(taskId, currentUser.organizationId);

    const comments = await this.prisma.taskComment.findMany({
      where: { taskId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return comments.map((comment) => ({
      id: comment.id,
      taskId: comment.taskId,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      author: comment.author,
    }));
  }

  async createTaskComment(currentUser: CurrentUserPayload, taskId: string, dto: CreateTaskCommentDto) {
    const task = await this.assertTaskScope(taskId, currentUser.organizationId);

    const comment = await this.prisma.taskComment.create({
      data: {
        taskId: task.id,
        authorId: currentUser.id,
        content: dto.content,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    await this.writeTaskHistory(task.id, currentUser.id, TaskHistoryAction.COMMENTED, {
      metadata: { commentId: comment.id },
    });

    this.sprintGateway.emitOrganizationEvent(currentUser.organizationId, 'comment.created', {
      taskId: task.id,
      commentId: comment.id,
    });

    return {
      id: comment.id,
      taskId: comment.taskId,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      author: comment.author,
    };
  }

  async getTaskActivity(currentUser: CurrentUserPayload, taskId: string) {
    await this.assertTaskScope(taskId, currentUser.organizationId);

    const [comments, history] = await Promise.all([
      this.prisma.taskComment.findMany({
        where: { taskId },
        include: {
          author: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.taskHistory.findMany({
        where: { taskId },
        include: {
          actor: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    type ActivityItem =
      | { type: 'comment'; createdAt: Date; id: string; taskId: string; content: string; author: { id: string; name: string; avatarUrl: string | null } }
      | { type: 'history'; createdAt: Date; id: string; action: string; fromStatus: string | null; toStatus: string | null; fromColumnId: string | null; toColumnId: string | null; actor: { id: string; name: string; avatarUrl: string | null } | null };

    const commentItems: ActivityItem[] = comments.map((c) => ({
      type: 'comment' as const,
      createdAt: c.createdAt,
      id: c.id,
      taskId: c.taskId,
      content: c.content,
      author: { id: c.author.id, name: c.author.name, avatarUrl: c.author.avatarUrl ?? null },
    }));

    const historyItems: ActivityItem[] = history.map((h) => ({
      type: 'history' as const,
      createdAt: h.createdAt,
      id: h.id,
      action: h.action,
      fromStatus: h.fromStatus,
      toStatus: h.toStatus,
      fromColumnId: h.fromColumnId,
      toColumnId: h.toColumnId,
      actor: h.actor
        ? { id: h.actor.id, name: h.actor.name, avatarUrl: h.actor.avatarUrl ?? null }
        : null,
    }));

    const timeline = [...commentItems, ...historyItems].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );

    return timeline.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
    }));
  }

  async deleteTaskComment(currentUser: CurrentUserPayload, taskId: string, commentId: string) {
    const comment = await this.prisma.taskComment.findFirst({
      where: {
        id: commentId,
        taskId,
        task: { project: { organizationId: currentUser.organizationId } },
      },
      select: { id: true, authorId: true, task: { select: { projectId: true } } },
    });

    if (!comment) {
      throw new NotFoundException('Comentário não encontrado');
    }

    const canDelete =
      comment.authorId === currentUser.id || ['OWNER', 'ADMIN'].includes(currentUser.role);

    if (!canDelete) {
      throw new ForbiddenException('Sem permissão para deletar este comentário');
    }

    await this.prisma.taskComment.delete({ where: { id: comment.id } });

    return { ok: true };
  }

  async listLabels(currentUser: CurrentUserPayload, query: LabelQueryDto) {
    await this.assertProjectScope(query.projectId, currentUser.organizationId);

    return this.prisma.label.findMany({
      where: { projectId: query.projectId },
      orderBy: [{ name: 'asc' }],
    });
  }

  async createLabel(currentUser: CurrentUserPayload, dto: CreateLabelDto) {
    await this.assertProjectScope(dto.projectId, currentUser.organizationId);

    return this.prisma.label.upsert({
      where: {
        projectId_name: {
          projectId: dto.projectId,
          name: dto.name,
        },
      },
      update: {
        color: dto.color ?? undefined,
      },
      create: {
        projectId: dto.projectId,
        name: dto.name,
        color: dto.color,
        createdById: currentUser.id,
      },
    });
  }

  private async assertProjectScope(projectId: string, organizationId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, organizationId },
      include: {
        board: {
          select: { id: true },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Projeto não encontrado');
    }

    return project;
  }

  private async assertTaskScope(taskId: string, organizationId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, project: { organizationId } },
      select: {
        id: true,
        projectId: true,
      },
    });

    if (!task) {
      throw new NotFoundException('Task não encontrada');
    }

    return task;
  }

  private async assertBoardColumn(columnId: string, projectId: string) {
    const column = await this.prisma.boardColumn.findFirst({
      where: {
        id: columnId,
        board: {
          projectId,
        },
      },
    });

    if (!column) {
      throw new BadRequestException('Coluna inválida para o projeto informado');
    }

    return column;
  }

  private async resolveBoardColumn(projectId: string, boardColumnId?: string | null) {
    if (boardColumnId) {
      return this.assertBoardColumn(boardColumnId, projectId);
    }

    return this.ensureBacklogColumn(projectId);
  }

  private async ensureBacklogColumn(projectId: string) {
    const existing = await this.prisma.boardColumn.findFirst({
      where: {
        board: { projectId },
        type: 'BACKLOG',
      },
    });

    if (existing) {
      return existing;
    }

    const board = await this.prisma.board.upsert({
      where: { projectId },
      update: {},
      create: { projectId },
      select: { id: true },
    });

    await this.prisma.boardColumn.createMany({
      data: DEFAULT_BOARD_COLUMNS.map((column) => ({
        boardId: board.id,
        name: column.name,
        type: column.type,
        order: column.order,
        wipLimit: column.wipLimit,
      })),
      skipDuplicates: true,
    });

    const backlogColumn = await this.prisma.boardColumn.findFirst({
      where: { boardId: board.id, type: 'BACKLOG' },
    });

    if (!backlogColumn) {
      throw new BadRequestException('Coluna de backlog não encontrada para o projeto');
    }

    return backlogColumn;
  }

  private async nextTaskPosition(projectId: string, boardColumnId: string | null) {
    const latest = await this.prisma.task.findFirst({
      where: {
        projectId,
        boardColumnId,
        deletedAt: null,
      },
      select: { position: true },
      orderBy: { position: 'desc' },
    });

    return latest ? latest.position + 1 : 0;
  }

  private generateTaskCode() {
    const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
    const random = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `TSK-${timestamp}${random}`;
  }

  private columnTypeToState(type?: BoardColumnType | null): TaskState {
    switch (type) {
      case 'TODO':
      case 'IN_PROGRESS':
      case 'REVIEW':
      case 'DONE':
      case 'BLOCKED':
      case 'BACKLOG':
        return type;
      default:
        return TaskState.BACKLOG;
    }
  }

  private async writeTaskHistory(
    taskId: string,
    actorId: string,
    action: TaskHistoryAction,
    payload: {
      fromStatus?: TaskState | null;
      toStatus?: TaskState | null;
      fromColumnId?: string | null;
      toColumnId?: string | null;
      metadata?: Prisma.InputJsonValue;
    },
  ) {
    await this.prisma.taskHistory.create({
      data: {
        taskId,
        actorId,
        action,
        fromStatus: payload.fromStatus ?? undefined,
        toStatus: payload.toStatus ?? undefined,
        fromColumnId: payload.fromColumnId ?? undefined,
        toColumnId: payload.toColumnId ?? undefined,
        metadata: payload.metadata,
      },
    });
  }

  private async persistLabelCatalog(
    currentUser: CurrentUserPayload,
    projectId: string,
    labels: string[],
    tx?: Prisma.TransactionClient,
  ) {
    if (labels.length === 0) {
      return;
    }

    const client = tx ?? this.prisma;

    await client.label.createMany({
      data: labels.map((name) => ({
        projectId,
        name,
        createdById: currentUser.id,
      })),
      skipDuplicates: true,
    });
  }

  private parseChecklist(raw: unknown): Array<{ id: string; title: string; done: boolean }> {
    if (!Array.isArray(raw)) return [];
    return raw
      .filter(
        (item): item is { id: string; title: string; done: boolean } =>
          item !== null &&
          typeof item === 'object' &&
          typeof (item as Record<string, unknown>).id === 'string' &&
          typeof (item as Record<string, unknown>).title === 'string' &&
          typeof (item as Record<string, unknown>).done === 'boolean',
      )
      .map((item) => ({
        id: item.id,
        title: item.title,
        done: item.done,
      }));
  }

  private mapTask(task: TaskWithRelations) {
    const labels = Array.isArray(task.labels)
      ? task.labels
          .map((item) => {
            if (typeof item === 'string') {
              return item;
            }
            if (item && typeof item === 'object' && 'name' in item) {
              const typed = item as Record<string, unknown>;
              return typeof typed.name === 'string' ? typed.name : null;
            }
            return null;
          })
          .filter((item): item is string => Boolean(item))
      : [];

    return {
      id: task.id,
      code: task.code,
      projectId: task.projectId,
      sprintId: task.sprintId,
      boardColumnId: task.boardColumnId,
      boardColumnType: task.boardColumn?.type ?? null,
      title: task.title,
      description: task.description,
      position: task.position,
      priority: task.priority,
      points: task.points,
      blocked: task.blocked,
      blockedReason: task.blockedReason,
      dueDate: task.dueDate ? task.dueDate.toISOString() : null,
      labels,
      checklist: this.parseChecklist(task.checklist),
      deletedAt: task.deletedAt ? task.deletedAt.toISOString() : null,
      assignees: task.assignees.map((assignee) => assignee.user),
      comments: task.comments.map((comment) => ({
        id: comment.id,
        taskId: comment.taskId,
        content: comment.content,
        createdAt: comment.createdAt.toISOString(),
        author: {
          id: comment.author.id,
          name: comment.author.name,
          avatarUrl: (comment.author as { avatarUrl?: string | null }).avatarUrl ?? null,
        },
      })),
      history: task.history.map((entry) => ({
        id: entry.id,
        action: entry.action,
        fromStatus: entry.fromStatus,
        toStatus: entry.toStatus,
        fromColumnId: entry.fromColumnId,
        toColumnId: entry.toColumnId,
        createdAt: entry.createdAt.toISOString(),
        actor: entry.actor
          ? {
              id: entry.actor.id,
              name: entry.actor.name,
              avatarUrl: entry.actor.avatarUrl ?? null,
            }
          : null,
      })),
      boardColumn: task.boardColumn
        ? {
            id: task.boardColumn.id,
            name: task.boardColumn.name,
            type: task.boardColumn.type,
          }
        : null,
      sprint: (task as unknown as { sprint?: { id: string; name: string } | null }).sprint
        ? {
            id: (task as unknown as { sprint: { id: string; name: string } }).sprint.id,
            name: (task as unknown as { sprint: { id: string; name: string } }).sprint.name,
          }
        : null,
      updatedAt: task.updatedAt.toISOString(),
      createdAt: task.createdAt.toISOString(),
    };
  }

  private async createTaskWithUniqueCode(data: Prisma.TaskUncheckedCreateInput): Promise<TaskWithRelations> {
    let nextCode = data.code as string;

    for (let attempt = 0; attempt < MAX_CODE_GENERATION_ATTEMPTS; attempt += 1) {
      try {
        return await this.prisma.task.create({
          data: {
            ...data,
            code: nextCode,
          },
          include: taskInclude,
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002' &&
          `${error.meta?.target}`.includes('code')
        ) {
          nextCode = this.generateTaskCode();
          continue;
        }

        throw error;
      }
    }

    throw new ConflictException('Não foi possível gerar um código único para a task');
  }

  private serializeLabels(labels?: string[]) {
    return labels?.length ? (labels.map((name) => ({ name })) as Prisma.InputJsonValue) : undefined;
  }
}
