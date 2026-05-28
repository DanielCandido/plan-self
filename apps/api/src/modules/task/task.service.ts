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
import type { CreateTaskDto } from './dto/create-task.dto';
import type { TaskQueryDto } from './dto/task-query.dto';
import type { UpdateTaskRestDto } from './dto/update-task.dto';
import type { CreateTaskCommentDto } from './dto/create-task-comment.dto';
import type { CreateLabelDto, LabelQueryDto } from './dto/task-label.dto';

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
        ...(query.status ? { status: query.status } : {}),
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
      include: this.taskInclude,
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
      include: this.taskInclude,
    });

    if (!task) {
      throw new NotFoundException('Task não encontrada');
    }

    return this.mapTask(task);
  }

  async createTask(currentUser: CurrentUserPayload, dto: CreateTaskDto) {
    const project = await this.assertProjectScope(dto.projectId, currentUser.organizationId);
    const boardColumn = dto.boardColumnId
      ? await this.assertBoardColumn(dto.boardColumnId, dto.projectId)
      : null;

    const status = dto.status ?? this.columnTypeToState(boardColumn?.type);
    const position = dto.position ?? (await this.nextTaskPosition(dto.projectId, dto.boardColumnId ?? null));

    const task = await this.prisma.task.create({
      data: {
        projectId: dto.projectId,
        boardId: project.board?.id ?? null,
        boardColumnId: dto.boardColumnId ?? null,
        sprintId: dto.sprintId,
        code: dto.code ?? this.generateTaskCode(),
        title: dto.title,
        description: dto.description,
        status,
        state: status,
        position,
        sortOrder: position,
        priority: dto.priority ?? 'MEDIUM',
        points: dto.points,
        storyPoints: dto.points,
        blocked: dto.blocked ?? Boolean(dto.blockedReason),
        blockedReason: dto.blockedReason,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        dueAt: dto.dueDate ? new Date(dto.dueDate) : null,
        labels: dto.labels ? (dto.labels.map((name) => ({ name })) as Prisma.InputJsonValue) : undefined,
        createdBy: currentUser.id,
        updatedBy: currentUser.id,
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
      include: this.taskInclude,
    });

    await this.persistLabelCatalog(currentUser, dto.projectId, dto.labels ?? []);
    await this.writeTaskHistory(task.id, currentUser.id, TaskHistoryAction.CREATED, {
      toStatus: task.status,
      toColumnId: task.boardColumnId,
    });

    this.sprintGateway.emitOrganizationEvent(currentUser.organizationId, 'task.created', {
      projectId: task.projectId,
      taskId: task.id,
    });

    return this.mapTask(task);
  }

  async updateTask(currentUser: CurrentUserPayload, taskId: string, dto: UpdateTaskRestDto) {
    const current = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        project: { organizationId: currentUser.organizationId },
      },
      include: this.taskInclude,
    });

    if (!current) {
      throw new NotFoundException('Task não encontrada');
    }

    if (current.deletedAt) {
      throw new BadRequestException('Task excluída não pode ser alterada');
    }

    if (dto.updatedAt && new Date(dto.updatedAt).getTime() !== current.updatedAt.getTime()) {
      throw new ConflictException('Task foi alterada por outro usuário');
    }

    if (
      current.status === TaskState.DONE &&
      dto.status &&
      dto.status !== TaskState.DONE &&
      !['OWNER', 'ADMIN'].includes(currentUser.role)
    ) {
      throw new ForbiddenException('Apenas Owner/Admin podem reabrir tasks DONE');
    }

    const targetColumn = dto.boardColumnId
      ? await this.assertBoardColumn(dto.boardColumnId, current.projectId)
      : null;
    const nextStatus = dto.status ?? (targetColumn ? this.columnTypeToState(targetColumn.type) : current.status);

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

      const result = await tx.task.update({
        where: { id: current.id },
        data: {
          title: dto.title,
          description: dto.description,
          status: nextStatus,
          state: nextStatus,
          priority: dto.priority,
          position: dto.position,
          sortOrder: dto.position,
          points: dto.points,
          storyPoints: dto.points,
          blocked: dto.blocked,
          blockedReason: dto.blockedReason === undefined ? undefined : dto.blockedReason,
          dueDate: dto.dueDate === undefined ? undefined : dto.dueDate ? new Date(dto.dueDate) : null,
          dueAt: dto.dueDate === undefined ? undefined : dto.dueDate ? new Date(dto.dueDate) : null,
          boardColumnId: dto.boardColumnId === undefined ? undefined : dto.boardColumnId,
          updatedBy: currentUser.id,
          labels: dto.labels ? (dto.labels.map((name) => ({ name })) as Prisma.InputJsonValue) : undefined,
        },
        include: this.taskInclude,
      });

      return result;
    });

    await this.writeTaskHistory(updated.id, currentUser.id, TaskHistoryAction.UPDATED, {
      fromStatus: current.status,
      toStatus: updated.status,
      fromColumnId: current.boardColumnId,
      toColumnId: updated.boardColumnId,
    });

    this.sprintGateway.emitOrganizationEvent(currentUser.organizationId, 'task.updated', {
      projectId: updated.projectId,
      taskId: updated.id,
    });

    return this.mapTask(updated);
  }

  async deleteTask(currentUser: CurrentUserPayload, taskId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, project: { organizationId: currentUser.organizationId } },
      select: { id: true, projectId: true, deletedAt: true },
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

    this.sprintGateway.emitOrganizationEvent(currentUser.organizationId, 'task.deleted', {
      projectId: task.projectId,
      taskId: task.id,
    });

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

  async listLabels(currentUser: CurrentUserPayload, query: LabelQueryDto) {
    await this.assertProjectScope(query.projectId, currentUser.organizationId);

    const labels = await this.prisma.label.findMany({
      where: { projectId: query.projectId },
      orderBy: [{ name: 'asc' }],
    });

    return labels;
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

  private readonly taskInclude = {
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
          },
        },
      },
      orderBy: { createdAt: 'desc' as const },
      take: 3,
    },
    boardColumn: {
      select: {
        id: true,
        name: true,
        type: true,
      },
    },
    history: {
      orderBy: { createdAt: 'desc' as const },
      take: 10,
    },
  } satisfies Prisma.TaskInclude;

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
    return `TSK-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
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

  private mapTask(task: Prisma.TaskGetPayload<{ include: typeof this.taskInclude }>) {
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
      title: task.title,
      description: task.description,
      status: task.status,
      state: task.state,
      position: task.position,
      priority: task.priority,
      points: task.points,
      blocked: task.blocked,
      blockedReason: task.blockedReason,
      dueDate: task.dueDate ? task.dueDate.toISOString() : null,
      labels,
      deletedAt: task.deletedAt ? task.deletedAt.toISOString() : null,
      assignees: task.assignees.map((assignee) => assignee.user),
      comments: task.comments.map((comment) => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt.toISOString(),
        author: comment.author,
      })),
      history: task.history.map((entry) => ({
        id: entry.id,
        action: entry.action,
        fromStatus: entry.fromStatus,
        toStatus: entry.toStatus,
        fromColumnId: entry.fromColumnId,
        toColumnId: entry.toColumnId,
        createdAt: entry.createdAt.toISOString(),
      })),
      updatedAt: task.updatedAt.toISOString(),
      createdAt: task.createdAt.toISOString(),
    };
  }
}
