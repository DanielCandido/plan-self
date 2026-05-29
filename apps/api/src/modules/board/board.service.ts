import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BoardColumnType, type Prisma, TaskHistoryAction, TaskState } from '@prisma/client';
import type { CurrentUserPayload } from '../auth/types/current-user.type';
import { PrismaService } from '../prisma/prisma.service';
import { SprintGateway } from '../sprints/sprint.gateway';
import type { MoveBoardTaskDto } from './dto/move-board-task.dto';
import type { ReorderBoardTaskDto } from './dto/reorder-board-task.dto';

const DEFAULT_COLUMNS: Array<{
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
export class BoardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sprintGateway: SprintGateway,
  ) {}

  async getBoard(currentUser: CurrentUserPayload, projectId: string) {
    await this.assertProjectScope(projectId, currentUser.organizationId);

    const board = await this.ensureBoard(projectId);
    const activeSprintId = await this.getActiveSprintId(projectId);

    const tasks = await this.prisma.task.findMany({
      where: this.getBoardTaskScope(projectId, activeSprintId),
      select: {
        id: true,
        code: true,
        title: true,
        status: true,
        state: true,
        boardColumnId: true,
        sprintId: true,
        position: true,
        blocked: true,
        blockedReason: true,
        dueDate: true,
        points: true,
        updatedAt: true,
      },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    });

    return {
      id: board.id,
      projectId: board.projectId,
      columns: board.columns.map((column) => ({
        id: column.id,
        name: column.name,
        order: column.order,
        type: column.type,
        wipLimit: column.wipLimit,
        taskCount: tasks.filter((task) => task.boardColumnId === column.id).length,
      })),
      tasks,
    };
  }

  async reorderTasks(currentUser: CurrentUserPayload, dto: ReorderBoardTaskDto) {
    await this.assertProjectScope(dto.projectId, currentUser.organizationId);

    const [column, activeSprintId] = await Promise.all([
      this.prisma.boardColumn.findFirst({
        where: {
          id: dto.columnId,
          board: { projectId: dto.projectId },
        },
        select: { id: true, type: true },
      }),
      this.getActiveSprintId(dto.projectId),
    ]);

    if (!column) {
      throw new NotFoundException('Coluna não encontrada');
    }

    const sprintId = this.getColumnSprintScope(column.type, activeSprintId);

    const tasks = await this.prisma.task.findMany({
      where: {
        id: { in: dto.orderedTaskIds },
        projectId: dto.projectId,
        boardColumnId: column.id,
        sprintId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (tasks.length !== dto.orderedTaskIds.length) {
      throw new BadRequestException('Lista de reordenação contém tasks inválidas');
    }

    await this.prisma.$transaction(async (tx) => {
      for (const [index, taskId] of dto.orderedTaskIds.entries()) {
        await tx.task.update({
          where: { id: taskId },
          data: {
            position: index,
            sortOrder: index,
            updatedBy: currentUser.id,
          },
        });
      }
    });

    this.sprintGateway.emitOrganizationEvent(currentUser.organizationId, 'task.moved', {
      projectId: dto.projectId,
      columnId: column.id,
      taskIds: dto.orderedTaskIds,
    });

    return { ok: true };
  }

  async moveTask(currentUser: CurrentUserPayload, dto: MoveBoardTaskDto) {
    await this.assertProjectScope(dto.projectId, currentUser.organizationId);

    const [task, targetColumn, activeSprintId] = await Promise.all([
      this.prisma.task.findFirst({
        where: {
          id: dto.taskId,
          projectId: dto.projectId,
          deletedAt: null,
        },
        select: {
          id: true,
          projectId: true,
          boardColumnId: true,
          status: true,
          position: true,
        },
      }),
      this.prisma.boardColumn.findFirst({
        where: {
          id: dto.targetColumnId,
          board: { projectId: dto.projectId },
        },
        select: { id: true, type: true, wipLimit: true },
      }),
      this.getActiveSprintId(dto.projectId),
    ]);

    if (!task) {
      throw new NotFoundException('Task não encontrada');
    }

    if (!targetColumn) {
      throw new NotFoundException('Coluna de destino não encontrada');
    }

    const targetSprintId = this.getColumnSprintScope(targetColumn.type, activeSprintId);

    if (targetColumn.wipLimit !== null) {
      const activeCount = await this.prisma.task.count({
        where: {
          projectId: dto.projectId,
          boardColumnId: targetColumn.id,
          sprintId: targetSprintId,
          deletedAt: null,
          ...(task.boardColumnId === targetColumn.id ? { id: { not: task.id } } : {}),
        },
      });
      if (activeCount >= targetColumn.wipLimit) {
        throw new BadRequestException('Limite de WIP da coluna foi atingido');
      }
    }

    const targetPosition =
      dto.targetPosition ??
      (await this.prisma.task.count({
        where: {
          projectId: dto.projectId,
          boardColumnId: targetColumn.id,
          sprintId: targetSprintId,
          deletedAt: null,
        },
      }));

    const nextState = this.columnTypeToState(targetColumn.type);

    await this.prisma.$transaction(async (tx) => {
      await tx.task.update({
        where: { id: task.id },
        data: {
          boardColumnId: targetColumn.id,
          sprintId: targetSprintId,
          position: targetPosition,
          sortOrder: targetPosition,
          status: nextState,
          state: nextState,
          updatedBy: currentUser.id,
        },
      });

      await tx.taskHistory.create({
        data: {
          taskId: task.id,
          actorId: currentUser.id,
          action: TaskHistoryAction.MOVED,
          fromStatus: task.status,
          toStatus: nextState,
          fromColumnId: task.boardColumnId,
          toColumnId: targetColumn.id,
        },
      });
    });

    this.sprintGateway.emitOrganizationEvent(currentUser.organizationId, 'task.moved', {
      projectId: dto.projectId,
      taskId: task.id,
      fromColumnId: task.boardColumnId,
      toColumnId: targetColumn.id,
    });

    return { ok: true };
  }

  private async ensureBoard(projectId: string) {
    let board = await this.prisma.board.findUnique({
      where: { projectId },
      include: {
        columns: { orderBy: { order: 'asc' } },
      },
    });

    if (board) {
      return board;
    }

    board = await this.prisma.board.create({
      data: {
        projectId,
        columns: {
          create: DEFAULT_COLUMNS,
        },
      },
      include: {
        columns: { orderBy: { order: 'asc' } },
      },
    });

    return board;
  }

  private async assertProjectScope(projectId: string, organizationId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, organizationId },
      select: { id: true },
    });

    if (!project) {
      throw new NotFoundException('Projeto não encontrado');
    }

    return project;
  }

  private async getActiveSprintId(projectId: string) {
    const activeSprint = await this.prisma.sprint.findFirst({
      where: {
        projectId,
        status: 'ACTIVE',
      },
      select: { id: true },
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
    });

    return activeSprint?.id ?? null;
  }

  private getBoardTaskScope(projectId: string, activeSprintId: string | null): Prisma.TaskWhereInput {
    return {
      projectId,
      deletedAt: null,
      ...(activeSprintId
        ? {
            OR: [{ sprintId: activeSprintId }, { sprintId: null }],
          }
        : { sprintId: null }),
    };
  }

  private getColumnSprintScope(type: BoardColumnType, activeSprintId: string | null) {
    if (type === 'BACKLOG') {
      return null;
    }

    if (!activeSprintId) {
      throw new BadRequestException('Não existe sprint ativa para mover tarefas para o board');
    }

    return activeSprintId;
  }

  private columnTypeToState(type: BoardColumnType): TaskState {
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
}
