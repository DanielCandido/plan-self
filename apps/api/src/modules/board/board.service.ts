import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BoardColumnType, TaskHistoryAction, TaskState } from '@prisma/client';
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

    const tasks = await this.prisma.task.findMany({
      where: {
        projectId,
        deletedAt: null,
      },
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

    const column = await this.prisma.boardColumn.findFirst({
      where: {
        id: dto.columnId,
        board: { projectId: dto.projectId },
      },
      select: { id: true, type: true },
    });

    if (!column) {
      throw new NotFoundException('Coluna não encontrada');
    }

    const tasks = await this.prisma.task.findMany({
      where: {
        id: { in: dto.orderedTaskIds },
        projectId: dto.projectId,
        boardColumnId: column.id,
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
            status: this.columnTypeToState(column.type),
            state: this.columnTypeToState(column.type),
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

    const [task, targetColumn] = await Promise.all([
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
    ]);

    if (!task) {
      throw new NotFoundException('Task não encontrada');
    }

    if (!targetColumn) {
      throw new NotFoundException('Coluna de destino não encontrada');
    }

    if (targetColumn.wipLimit !== null) {
      const activeCount = await this.prisma.task.count({
        where: {
          projectId: dto.projectId,
          boardColumnId: targetColumn.id,
          deletedAt: null,
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
          deletedAt: null,
        },
      }));

    const nextState = this.columnTypeToState(targetColumn.type);

    await this.prisma.$transaction(async (tx) => {
      await tx.task.update({
        where: { id: task.id },
        data: {
          boardColumnId: targetColumn.id,
          position: targetPosition,
          sortOrder: targetPosition,
          status: nextState,
          state: nextState,
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
