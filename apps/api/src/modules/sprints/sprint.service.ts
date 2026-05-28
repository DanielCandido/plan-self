import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, SprintAuditAction, SprintStatus, TaskState, type Role } from '@prisma/client';
import type { CurrentUserPayload } from '../auth/types/current-user.type';
import { SprintGateway } from './sprint.gateway';
import { SprintRepository, type HydratedSprint, type HydratedTask } from './sprint.repository';
import {
  AddSprintTasksDto,
  BacklogQueryDto,
  CompleteSprintDto,
  CreateSprintDto,
  MoveTaskDto,
  ReorderTaskDto,
  UpdateSprintDto,
  UpdateTaskDto,
} from './dto';
import {
  assertCanManageSprint,
  assertSprintMutable,
  calculateCapacity,
  calculateDurationDays,
  calculateVelocity,
  canManageSprint,
  canMoveTask,
  computeSprintMetrics,
  validateSprintWindow,
  type SprintMetricTaskInput,
} from './sprint.rules';

const DEFAULT_DAILY_CAPACITY = 8;
const MAX_SPRINT_DURATION_DAYS = 21;
const MAX_HISTORY_ITEMS = 25;

@Injectable()
export class SprintService {
  constructor(
    private readonly repository: SprintRepository,
    private readonly sprintGateway: SprintGateway,
  ) {}

  async getProjectBoard(projectId: string, currentUser: CurrentUserPayload) {
    const project = await this.repository.getProjectOrThrow(projectId, currentUser.organizationId);

    const [sprints, completedSprints, backlogCount, teamMembers] = await Promise.all([
      this.repository.listProjectSprints(projectId, currentUser.organizationId),
      this.repository.listCompletedSprints(projectId),
      this.repository.getProjectBacklogCount(projectId),
      this.repository.getProjectUsers(projectId, currentUser.organizationId),
    ]);

    const activeSprint = sprints.find((sprint) => sprint.status === SprintStatus.ACTIVE) ?? null;
    const selectedSprint = activeSprint ?? sprints[0] ?? null;

    return {
      projectId,
      projectName: project.name,
      role: currentUser.role,
      permissions: this.buildPermissions(currentUser.role),
      activeSprint: activeSprint ? this.mapSprint(activeSprint) : null,
      sprints: sprints.map((sprint) => this.mapSprint(sprint)),
      metrics: selectedSprint ? selectedSprint.metrics.map((metric) => this.mapMetric(metric)) : [],
      burndown: selectedSprint ? selectedSprint.snapshots.map((snapshot) => this.mapBurndown(snapshot)) : [],
      history: selectedSprint
        ? selectedSprint.auditLogs.slice(0, MAX_HISTORY_ITEMS).map((entry) => this.mapHistory(entry))
        : [],
      velocityTrend: completedSprints
        .slice()
        .reverse()
        .map((sprint) => ({
          sprintId: sprint.id,
          name: sprint.name,
          velocity: sprint.velocity,
          completedPoints: sprint.completedPoints,
        })),
      backlogCount,
      teamMembers: teamMembers.map((member) => ({ userId: member.userId, name: member.name, avatarUrl: member.avatarUrl })),
    };
  }

  async getActiveSprint(projectId: string, currentUser: CurrentUserPayload) {
    await this.repository.getProjectOrThrow(projectId, currentUser.organizationId);
    const sprint = await this.repository.findActiveSprint(projectId);

    if (!sprint) {
      throw new NotFoundException('Nenhuma sprint ativa encontrada');
    }

    return this.mapSprint(sprint);
  }

  async getCurrentSprint(currentUser: CurrentUserPayload, projectId?: string) {
    if (projectId) {
      return this.getActiveSprint(projectId, currentUser);
    }

    const sprint = await this.repository.findCurrentActiveSprint(currentUser.organizationId);
    if (!sprint) {
      throw new NotFoundException('Nenhuma sprint ativa encontrada');
    }

    return this.mapSprint(sprint);
  }

  async getBacklog(projectId: string, currentUser: CurrentUserPayload, query: BacklogQueryDto) {
    const backlog = await this.repository.listBacklogTasks(projectId, currentUser.organizationId, {
      page: query.page,
      limit: query.limit,
      search: query.search,
      priority: query.priority,
      epicId: query.epicId,
      assigneeId: query.assigneeId,
      sortBy: query.sortBy,
      order: query.order,
    });

    const ungroupedKey = 'ungrouped';
    const items = backlog.items.map((task) => this.mapTask(task));
    type MappedTask = (typeof items)[number];
    const groupedMap = new Map<string, { id: string; name: string; color: string | null; tasks: MappedTask[] }>();

    for (const task of items) {
      const groupId = task.epic?.id ?? ungroupedKey;
      const groupName = task.epic?.name ?? 'Sem epic';
      const groupColor = task.epic?.color ?? null;
      const existing = groupedMap.get(groupId) ?? { id: groupId, name: groupName, color: groupColor, tasks: [] };
      existing.tasks.push(task);
      groupedMap.set(groupId, existing);
    }

    const grouped = Array.from(groupedMap.values()).map((group) => ({
      id: group.id,
      name: group.name,
      color: group.color,
      totalStoryPoints: group.tasks.reduce((sum, task) => sum + (task.storyPoints ?? 0), 0),
      taskCount: group.tasks.length,
      tasks: group.tasks,
    }));

    return {
      projectId: backlog.project.id,
      projectName: backlog.project.name,
      items,
      grouped,
      nextCursor:
        (query.page + 1) * query.limit < backlog.totalCount ? String(query.page + 1) : null,
      totalCount: backlog.totalCount,
      appliedFilters: {
        search: query.search,
        priority: query.priority ?? null,
        epicId: query.epicId ?? null,
        assigneeId: query.assigneeId ?? null,
        sortBy: query.sortBy,
        order: query.order,
      },
    };
  }

  async createSprint(currentUser: CurrentUserPayload, dto: CreateSprintDto) {
    assertCanManageSprint(currentUser.role);

    const project = await this.repository.getProjectOrThrow(dto.projectId, currentUser.organizationId);
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    const durationDays = this.validateSprintDates(startDate, endDate);
    const memberRecords = await this.resolveMembers(dto.projectId, currentUser.organizationId, dto.members);
    const capacity = calculateCapacity(durationDays, memberRecords);
    const velocity = dto.targetVelocity ?? (await this.getHistoricalVelocity(dto.projectId));

    const sprint = await this.repository.withTransaction(async (tx) => {
      const created = await tx.sprint.create({
        data: {
          projectId: project.id,
          name: dto.name,
          goal: dto.goal,
          objective: dto.objective,
          notes: dto.notes,
          startDate,
          endDate,
          capacity,
          velocity,
          createdBy: currentUser.id,
          members: {
            create: memberRecords.map((member) => ({
              userId: member.userId,
              dailyCapacity: member.dailyCapacity,
              availabilityPercent: member.availabilityPercent,
              totalCapacity: Math.round(
                member.dailyCapacity * durationDays * (member.availabilityPercent / 100),
              ),
            })),
          },
        },
        include: { members: true },
      });

      await this.writeSprintAudit(tx, created.id, project.id, currentUser.id, SprintAuditAction.CREATED, {
        name: created.name,
        capacity,
        velocity,
      });

      await tx.sprintMetric.create({
        data: {
          sprintId: created.id,
          velocity,
          healthScore: 100,
          capacityUtilization: 0,
        },
      });

      return created.id;
    });

    const hydrated = await this.repository.getSprintOrThrow(sprint, currentUser.organizationId);
    this.emitSprintEvent(currentUser.organizationId, 'sprint.updated', hydrated.id);
    return this.mapSprint(hydrated);
  }

  async updateSprint(sprintId: string, currentUser: CurrentUserPayload, dto: UpdateSprintDto) {
    assertCanManageSprint(currentUser.role);
    const sprint = await this.repository.getSprintOrThrow(sprintId, currentUser.organizationId);
    assertSprintMutable(sprint.status);

    const startDate = dto.startDate ? new Date(dto.startDate) : sprint.startDate;
    const endDate = dto.endDate ? new Date(dto.endDate) : sprint.endDate;
    let durationDays = sprint.startDate && sprint.endDate ? calculateDurationDays(sprint.startDate, sprint.endDate) : 0;

    if (startDate && endDate) {
      durationDays = this.validateSprintDates(startDate, endDate);
    }

    const memberRecords = dto.members
      ? await this.resolveMembers(sprint.projectId, currentUser.organizationId, dto.members)
      : sprint.members.map((member) => ({
          userId: member.userId,
          name: member.user.name,
          avatarUrl: member.user.avatarUrl,
          role: currentUser.role,
          dailyCapacity: member.dailyCapacity,
          availabilityPercent: member.availabilityPercent,
        }));
    const capacity = durationDays > 0 ? calculateCapacity(durationDays, memberRecords) : sprint.capacity;
    const velocity = dto.targetVelocity ?? sprint.velocity;

    await this.repository.withTransaction(async (tx) => {
      await tx.sprint.update({
        where: { id: sprint.id },
        data: {
          name: dto.name,
          goal: dto.goal,
          objective: dto.objective,
          notes: dto.notes,
          startDate,
          endDate,
          status: dto.status,
          capacity,
          velocity,
        },
      });

      if (dto.members) {
        await tx.sprintMember.deleteMany({ where: { sprintId: sprint.id } });
        await tx.sprintMember.createMany({
          data: memberRecords.map((member) => ({
            sprintId: sprint.id,
            userId: member.userId,
            dailyCapacity: member.dailyCapacity,
            availabilityPercent: member.availabilityPercent,
            totalCapacity: Math.round(
              member.dailyCapacity * Math.max(1, durationDays) * (member.availabilityPercent / 100),
            ),
          })),
          skipDuplicates: true,
        });
      }

      await this.writeSprintAudit(tx, sprint.id, sprint.projectId, currentUser.id, SprintAuditAction.UPDATED, {
        changes: dto,
      });

      if (dto.startDate || dto.endDate) {
        await this.writeSprintAudit(
          tx,
          sprint.id,
          sprint.projectId,
          currentUser.id,
          SprintAuditAction.DATES_CHANGED,
          {
            startDate: startDate?.toISOString() ?? null,
            endDate: endDate?.toISOString() ?? null,
          },
        );
      }
    });

    const refreshed = await this.syncSprintMetrics(sprint.id, currentUser.organizationId);
    return this.mapSprint(refreshed);
  }

  async deleteSprint(sprintId: string, currentUser: CurrentUserPayload) {
    assertCanManageSprint(currentUser.role);
    const sprint = await this.repository.getSprintOrThrow(sprintId, currentUser.organizationId);
    assertSprintMutable(sprint.status);

    await this.repository.withTransaction(async (tx) => {
      await tx.task.updateMany({
        where: {
          sprintId: sprint.id,
          state: { not: TaskState.DONE },
        },
        data: {
          sprintId: null,
          state: TaskState.BACKLOG,
        },
      });
      await tx.sprintTask.deleteMany({ where: { sprintId: sprint.id } });
      await tx.sprint.delete({ where: { id: sprint.id } });
      await tx.auditLog.create({
        data: {
          organizationId: currentUser.organizationId,
          actorId: currentUser.id,
          action: 'sprint.deleted',
          metadata: { sprintId: sprint.id, projectId: sprint.projectId, sprintName: sprint.name },
        },
      });
    });

    this.emitSprintEvent(currentUser.organizationId, 'sprint.updated', sprint.id);
    return { ok: true };
  }

  async startSprint(sprintId: string, currentUser: CurrentUserPayload) {
    assertCanManageSprint(currentUser.role);
    const sprint = await this.repository.getSprintOrThrow(sprintId, currentUser.organizationId);
    assertSprintMutable(sprint.status);

    if (sprint.status === SprintStatus.ACTIVE) {
      return this.mapSprint(sprint);
    }

    const existingActive = await this.repository.findActiveSprint(sprint.projectId);
    if (existingActive && existingActive.id !== sprint.id) {
      throw new BadRequestException('Apenas 1 sprint ativa é permitida por projeto');
    }

    if (!sprint.startDate || !sprint.endDate) {
      throw new BadRequestException('A sprint precisa possuir datas válidas antes de iniciar');
    }

    this.validateSprintDates(sprint.startDate, sprint.endDate);
    await this.ensureDependenciesAllowSprintStart(sprint.id);

    await this.repository.withTransaction(async (tx) => {
      await tx.sprint.update({
        where: { id: sprint.id },
        data: { status: SprintStatus.ACTIVE },
      });
      await this.writeSprintAudit(tx, sprint.id, sprint.projectId, currentUser.id, SprintAuditAction.STARTED, {
        startedAt: new Date().toISOString(),
      });
    });

    const refreshed = await this.syncSprintMetrics(sprint.id, currentUser.organizationId);
    await this.captureBurndownSnapshot(refreshed);
    this.emitSprintEvent(currentUser.organizationId, 'sprint.updated', refreshed.id);
    return this.mapSprint(refreshed);
  }

  async completeSprint(sprintId: string, currentUser: CurrentUserPayload, dto: CompleteSprintDto) {
    assertCanManageSprint(currentUser.role);
    const sprint = await this.repository.getSprintOrThrow(sprintId, currentUser.organizationId);

    if (sprint.status !== SprintStatus.ACTIVE && sprint.status !== SprintStatus.PLANNING) {
      throw new BadRequestException('A sprint não está em um estado finalizável');
    }

    const metrics = this.buildMetricsFromTasks(sprint.tasks, sprint.capacity, sprint.velocity);
    const carryOverIds = new Set(
      dto.carryOverTaskIds && dto.carryOverTaskIds.length > 0
        ? dto.carryOverTaskIds
        : sprint.tasks.filter((task) => task.state !== TaskState.DONE).map((task) => task.id),
    );

    await this.repository.withTransaction(async (tx) => {
      await tx.burndownSnapshot.create({
        data: {
          sprintId: sprint.id,
          snapshotDate: new Date(),
          remainingPoints: metrics.remainingPoints,
          completedPoints: metrics.completedPoints,
          blockedTasks: sprint.tasks.filter((task) => this.isTaskBlocked(task)).length,
        },
      });

      await tx.sprintMetric.create({
        data: {
          sprintId: sprint.id,
          totalStoryPoints: metrics.totalStoryPoints,
          completedPoints: metrics.completedPoints,
          remainingPoints: metrics.remainingPoints,
          blockedPoints: metrics.blockedPoints,
          progress: metrics.progress,
          velocity: metrics.completedPoints,
          throughput: metrics.throughput,
          capacityUtilization: metrics.capacityUtilization,
          healthScore: metrics.healthScore,
        },
      });

      const carryOverTasks = sprint.tasks.filter(
        (task) => task.state !== TaskState.DONE && carryOverIds.has(task.id),
      );
      const carryOverTaskIds = carryOverTasks.map((task) => task.id);

      if (carryOverTaskIds.length > 0) {
        await tx.task.updateMany({
          where: { id: { in: carryOverTaskIds } },
          data: { sprintId: null, state: TaskState.BACKLOG },
        });
        await tx.sprintTask.deleteMany({
          where: { sprintId: sprint.id, taskId: { in: carryOverTaskIds } },
        });
      }

      await tx.sprint.update({
        where: { id: sprint.id },
        data: {
          status: SprintStatus.COMPLETED,
          completedAt: new Date(),
          storyPoints: metrics.totalStoryPoints,
          completedPoints: metrics.completedPoints,
          remainingPoints: metrics.remainingPoints,
          blockedPoints: metrics.blockedPoints,
          healthScore: metrics.healthScore,
          velocity: metrics.completedPoints,
        },
      });

      await this.writeSprintAudit(tx, sprint.id, sprint.projectId, currentUser.id, SprintAuditAction.COMPLETED, {
        notes: dto.notes ?? null,
        carryOverTaskIds,
      });
      await tx.auditLog.create({
        data: {
          organizationId: currentUser.organizationId,
          actorId: currentUser.id,
          action: 'sprint.completed',
          metadata: { sprintId: sprint.id, projectId: sprint.projectId, carryOverTaskIds },
        },
      });
    });

    const refreshed = await this.repository.getSprintOrThrow(sprint.id, currentUser.organizationId);
    this.emitSprintEvent(currentUser.organizationId, 'sprint.completed', refreshed.id);
    return this.mapSprint(refreshed);
  }

  async cancelSprint(sprintId: string, currentUser: CurrentUserPayload) {
    assertCanManageSprint(currentUser.role);
    const sprint = await this.repository.getSprintOrThrow(sprintId, currentUser.organizationId);
    assertSprintMutable(sprint.status);

    await this.repository.withTransaction(async (tx) => {
      await tx.task.updateMany({
        where: { sprintId: sprint.id, state: { not: TaskState.DONE } },
        data: { sprintId: null, state: TaskState.BACKLOG },
      });
      await tx.sprintTask.deleteMany({ where: { sprintId: sprint.id } });
      await tx.sprint.update({ where: { id: sprint.id }, data: { status: SprintStatus.CANCELLED } });
      await this.writeSprintAudit(tx, sprint.id, sprint.projectId, currentUser.id, SprintAuditAction.CANCELLED, {
        cancelledAt: new Date().toISOString(),
      });
    });

    const refreshed = await this.repository.getSprintOrThrow(sprint.id, currentUser.organizationId);
    this.emitSprintEvent(currentUser.organizationId, 'sprint.updated', refreshed.id);
    return this.mapSprint(refreshed);
  }

  async addTasksToSprint(sprintId: string, currentUser: CurrentUserPayload, dto: AddSprintTasksDto) {
    return this.moveTasks(dto.taskIds[0], currentUser, {
      projectId: (await this.repository.getSprintOrThrow(sprintId, currentUser.organizationId)).projectId,
      taskIds: dto.taskIds,
      targetSprintId: sprintId,
      targetIndex: undefined,
    });
  }

  async removeTaskFromSprint(sprintId: string, taskId: string, currentUser: CurrentUserPayload) {
    return this.moveTasks(taskId, currentUser, {
      projectId: (await this.repository.getSprintOrThrow(sprintId, currentUser.organizationId)).projectId,
      taskIds: [taskId],
      targetSprintId: null,
      targetIndex: undefined,
    });
  }

  async reorderTasks(taskId: string, currentUser: CurrentUserPayload, dto: ReorderTaskDto) {
    const taskIds = Array.from(new Set([taskId, ...dto.orderedTaskIds]));
    const tasks = await this.repository.getTasksForProject(taskIds, dto.projectId, currentUser.organizationId);
    await this.assertTaskAccess(tasks, currentUser);

    await this.repository.withTransaction(async (tx) => {
      await Promise.all(
        dto.orderedTaskIds.map((orderedTaskId, index) =>
          tx.task.update({
            where: { id: orderedTaskId },
            data: { sortOrder: index, position: index, updatedBy: currentUser.id },
          }),
        ),
      );

      if (dto.sprintId) {
        await Promise.all(
          dto.orderedTaskIds.map((orderedTaskId, index) =>
            tx.sprintTask.updateMany({
              where: { sprintId: dto.sprintId!, taskId: orderedTaskId },
              data: { position: index },
            }),
          ),
        );
      }
    });

    if (dto.sprintId) {
      await this.syncSprintMetrics(dto.sprintId, currentUser.organizationId);
    }

    return { ok: true };
  }

  async moveTasks(taskId: string, currentUser: CurrentUserPayload, dto: MoveTaskDto) {
    const taskIds = Array.from(new Set([taskId, ...dto.taskIds]));
    const tasks = await this.repository.getTasksForProject(taskIds, dto.projectId, currentUser.organizationId);
    if (tasks.length !== taskIds.length) {
      throw new NotFoundException('Nem todas as tasks foram encontradas');
    }

    await this.assertTaskAccess(tasks, currentUser);

    const targetSprint = dto.targetSprintId
      ? await this.repository.getSprintOrThrow(dto.targetSprintId, currentUser.organizationId)
      : null;
    if (targetSprint) {
      assertSprintMutable(targetSprint.status);
    }

    for (const task of tasks) {
      if (targetSprint && task.state === TaskState.DONE) {
        throw new BadRequestException('Tasks DONE não podem entrar na sprint');
      }
      if (targetSprint && task.sprintId && task.sprintId !== targetSprint.id) {
        throw new BadRequestException('Task já está vinculada a outra sprint');
      }
    }

    const previousSprintIds = Array.from(new Set(tasks.map((task) => task.sprintId).filter(Boolean))) as string[];

    await this.repository.withTransaction(async (tx) => {
      if (targetSprint) {
        const existingCount = await tx.sprintTask.count({ where: { sprintId: targetSprint.id } });
        await Promise.all(
          tasks.map((task, index) =>
            tx.task.update({
              where: { id: task.id },
              data: {
                sprintId: targetSprint.id,
                state: task.state === TaskState.BACKLOG ? TaskState.TODO : task.state,
                status: task.state === TaskState.BACKLOG ? TaskState.TODO : task.state,
                sortOrder: dto.targetIndex != null ? dto.targetIndex + index : existingCount + index,
                position: dto.targetIndex != null ? dto.targetIndex + index : existingCount + index,
                updatedBy: currentUser.id,
              },
            }),
          ),
        );

        await Promise.all(
          tasks.map((task, index) =>
            tx.sprintTask.upsert({
              where: { taskId: task.id },
              update: {
                sprintId: targetSprint.id,
                position: dto.targetIndex != null ? dto.targetIndex + index : existingCount + index,
                removedAt: null,
              },
              create: {
                sprintId: targetSprint.id,
                taskId: task.id,
                addedBy: currentUser.id,
                position: dto.targetIndex != null ? dto.targetIndex + index : existingCount + index,
              },
            }),
          ),
        );

        await this.writeSprintAudit(tx, targetSprint.id, targetSprint.projectId, currentUser.id, SprintAuditAction.TASK_ADDED, {
          taskIds,
        });
      } else {
        await tx.task.updateMany({
          where: { id: { in: taskIds } },
          data: {
            sprintId: null,
            state: TaskState.BACKLOG,
            status: TaskState.BACKLOG,
            updatedBy: currentUser.id,
          },
        });
        await tx.sprintTask.deleteMany({ where: { taskId: { in: taskIds } } });
      }
    });

    for (const sprintIdToSync of new Set([...(targetSprint ? [targetSprint.id] : []), ...previousSprintIds])) {
      await this.syncSprintMetrics(sprintIdToSync, currentUser.organizationId);
    }

    if (targetSprint) {
      this.emitSprintEvent(currentUser.organizationId, 'task.moved', targetSprint.id);
      return this.mapSprint(await this.repository.getSprintOrThrow(targetSprint.id, currentUser.organizationId));
    }

    this.emitSprintEvent(currentUser.organizationId, 'task.moved');
    return { ok: true };
  }

  async updateTask(taskId: string, currentUser: CurrentUserPayload, dto: UpdateTaskDto) {
    const task = await this.repository.findTaskById(taskId, currentUser.organizationId);
    await this.assertTaskAccess([task], currentUser);

    const labelPayload = dto.labelNames?.map((name) => ({ name })) ?? undefined;

    await this.repository.withTransaction(async (tx) => {
      await tx.task.update({
        where: { id: task.id },
        data: {
          title: dto.title,
          priority: dto.priority,
          points: dto.storyPoints,
          storyPoints: dto.storyPoints,
          blocked: dto.blockedReason !== undefined ? Boolean(dto.blockedReason) : undefined,
          blockedReason: dto.blockedReason,
          updatedBy: currentUser.id,
          labels: labelPayload ? (labelPayload as Prisma.InputJsonValue) : undefined,
        },
      });

      if (dto.assigneeIds) {
        await tx.taskAssignee.deleteMany({ where: { taskId: task.id } });
        if (dto.assigneeIds.length > 0) {
          await tx.taskAssignee.createMany({
            data: dto.assigneeIds.map((userId) => ({ taskId: task.id, userId })),
            skipDuplicates: true,
          });
        }
      }
    });

    if (task.sprintId) {
      await this.syncSprintMetrics(task.sprintId, currentUser.organizationId);
    }

    return this.repository.findTaskById(task.id, currentUser.organizationId).then((refreshed) => this.mapTask(refreshed));
  }

  async deleteTask(taskId: string, currentUser: CurrentUserPayload) {
    const task = await this.repository.findTaskById(taskId, currentUser.organizationId);
    await this.assertTaskAccess([task], currentUser);

    await this.repository.prisma.task.update({
      where: { id: task.id },
      data: {
        deletedAt: new Date(),
        updatedBy: currentUser.id,
      },
    });

    if (task.sprintId) {
      await this.syncSprintMetrics(task.sprintId, currentUser.organizationId);
      this.emitSprintEvent(currentUser.organizationId, 'sprint.updated', task.sprintId);
    }

    this.emitSprintEvent(currentUser.organizationId, 'task.moved');
    return { ok: true };
  }

  async getBurndown(sprintId: string, currentUser: CurrentUserPayload) {
    const snapshots = await this.repository.listBurndown(sprintId, currentUser.organizationId);
    return snapshots.map((snapshot) => this.mapBurndown(snapshot));
  }

  async getMetrics(sprintId: string, currentUser: CurrentUserPayload) {
    const metrics = await this.repository.listSprintMetrics(sprintId, currentUser.organizationId);
    return metrics.map((metric) => this.mapMetric(metric));
  }

  async getHistory(sprintId: string, currentUser: CurrentUserPayload) {
    const history = await this.repository.listSprintHistory(sprintId, currentUser.organizationId);
    return history.map((entry) => this.mapHistory(entry));
  }

  async captureActiveSprintSnapshots() {
    const activeSprints = await this.repository.listActiveSprintsForSnapshots();
    for (const sprint of activeSprints) {
      const metrics = this.buildMetricsFromTasks(sprint.tasks, sprint.capacity, sprint.velocity);
      await this.repository.prisma.burndownSnapshot.upsert({
        where: {
          sprintId_snapshotDate: {
            sprintId: sprint.id,
            snapshotDate: this.startOfDay(new Date()),
          },
        },
        update: {
          remainingPoints: metrics.remainingPoints,
          completedPoints: metrics.completedPoints,
          blockedTasks: sprint.tasks.filter((task) => this.isTaskBlocked(task)).length,
        },
        create: {
          sprintId: sprint.id,
          snapshotDate: this.startOfDay(new Date()),
          remainingPoints: metrics.remainingPoints,
          completedPoints: metrics.completedPoints,
          blockedTasks: sprint.tasks.filter((task) => this.isTaskBlocked(task)).length,
        },
      });
    }

    return activeSprints.length;
  }

  private async syncSprintMetrics(sprintId: string, organizationId: string) {
    const sprint = await this.repository.getSprintOrThrow(sprintId, organizationId);
    const metrics = this.buildMetricsFromTasks(sprint.tasks, sprint.capacity, sprint.velocity);

    await this.repository.prisma.sprint.update({
      where: { id: sprint.id },
      data: {
        storyPoints: metrics.totalStoryPoints,
        completedPoints: metrics.completedPoints,
        remainingPoints: metrics.remainingPoints,
        blockedPoints: metrics.blockedPoints,
        healthScore: metrics.healthScore,
      },
    });

    await this.repository.prisma.sprintMetric.create({
      data: {
        sprintId: sprint.id,
        totalStoryPoints: metrics.totalStoryPoints,
        completedPoints: metrics.completedPoints,
        remainingPoints: metrics.remainingPoints,
        blockedPoints: metrics.blockedPoints,
        progress: metrics.progress,
        velocity: sprint.velocity,
        throughput: metrics.throughput,
        capacityUtilization: metrics.capacityUtilization,
        healthScore: metrics.healthScore,
      },
    });

    this.emitSprintEvent(organizationId, 'metrics.updated', sprint.id);
    return this.repository.getSprintOrThrow(sprint.id, organizationId);
  }

  private buildPermissions(role: Role) {
    return {
      canManageSprint: canManageSprint(role),
      canMoveAnyTask: ['OWNER', 'ADMIN', 'MANAGER'].includes(role),
      canMoveOwnTasks: role === 'MEMBER',
      canEditCompletedSprint: ['OWNER', 'ADMIN'].includes(role),
    };
  }

  private async resolveMembers(
    projectId: string,
    organizationId: string,
    members: CreateSprintDto['members'],
  ) {
    if (!members || members.length === 0) {
      throw new BadRequestException('Selecione ao menos um membro para a sprint');
    }

    const availableMembers = await this.repository.getProjectUsers(projectId, organizationId);
    const availableMap = new Map(availableMembers.map((member) => [member.userId, member]));

    return members.map((member) => {
      const available = availableMap.get(member.userId);
      if (!available) {
        throw new BadRequestException('Um ou mais membros não pertencem ao projeto');
      }

      return {
        ...available,
        dailyCapacity: member.dailyCapacity ?? DEFAULT_DAILY_CAPACITY,
        availabilityPercent: member.availabilityPercent ?? 100,
      };
    });
  }

  private validateSprintDates(startDate: Date, endDate: Date) {
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new BadRequestException('Datas inválidas para a sprint');
    }

    return validateSprintWindow(startDate, endDate, new Date(), MAX_SPRINT_DURATION_DAYS);
  }

  private async getHistoricalVelocity(projectId: string) {
    const completed = await this.repository.listCompletedSprints(projectId);
    return calculateVelocity(completed.map((sprint) => sprint.completedPoints));
  }

  private async ensureDependenciesAllowSprintStart(sprintId: string) {
    const criticalDependencies = await this.repository.getCriticalDependencies(sprintId);
    const unresolved = criticalDependencies.filter(
      (dependency) => dependency.blocker.state !== TaskState.DONE || dependency.blocked.state === TaskState.BLOCKED,
    );

    if (unresolved.length > 0) {
      throw new BadRequestException('Existem dependências críticas inválidas para iniciar a sprint');
    }
  }

  private buildMetricsFromTasks(tasks: HydratedTask[], capacity: number, velocity: number) {
    const inputs: SprintMetricTaskInput[] = tasks.map((task) => ({
      state: task.state,
      storyPoints: task.storyPoints ?? task.story?.storyPoints ?? 0,
      isBlocked: this.isTaskBlocked(task),
    }));
    return computeSprintMetrics(inputs, capacity, velocity);
  }

  private isTaskBlocked(task: HydratedTask) {
    return (
      task.state === TaskState.BLOCKED ||
      Boolean(task.blockedReason) ||
      task.blockedByDependencies.some((dependency) => dependency.blocker.state !== TaskState.DONE)
    );
  }

  private async assertTaskAccess(tasks: HydratedTask[], currentUser: CurrentUserPayload) {
    if (tasks.length === 0) {
      return;
    }

    if (['OWNER', 'ADMIN', 'MANAGER'].includes(currentUser.role)) {
      return;
    }

    if (currentUser.role === 'GUEST') {
      throw new ForbiddenException('Convidados possuem somente acesso de leitura');
    }

    const ownership = await this.repository.getTaskOwnership(
      tasks.map((task) => task.id),
      currentUser.id,
    );

    const unauthorized = tasks.some((task) => !canMoveTask(currentUser.role, ownership.has(task.id)));
    if (unauthorized) {
      throw new ForbiddenException('Você só pode mover tasks atribuídas a você');
    }
  }

  private async writeSprintAudit(
    tx: Prisma.TransactionClient,
    sprintId: string,
    projectId: string,
    actorId: string,
    action: SprintAuditAction,
    metadata: Record<string, unknown>,
  ) {
    await tx.sprintAuditLog.create({
      data: {
        sprintId,
        projectId,
        actorId,
        action,
        metadata: metadata as Prisma.InputJsonValue,
      },
    });
  }

  private async captureBurndownSnapshot(sprint: HydratedSprint) {
    const metrics = this.buildMetricsFromTasks(sprint.tasks, sprint.capacity, sprint.velocity);
    await this.repository.prisma.burndownSnapshot.upsert({
      where: {
        sprintId_snapshotDate: {
          sprintId: sprint.id,
          snapshotDate: this.startOfDay(new Date()),
        },
      },
      update: {
        remainingPoints: metrics.remainingPoints,
        completedPoints: metrics.completedPoints,
        blockedTasks: sprint.tasks.filter((task) => this.isTaskBlocked(task)).length,
      },
      create: {
        sprintId: sprint.id,
        snapshotDate: this.startOfDay(new Date()),
        remainingPoints: metrics.remainingPoints,
        completedPoints: metrics.completedPoints,
        blockedTasks: sprint.tasks.filter((task) => this.isTaskBlocked(task)).length,
      },
    });
  }

  private emitSprintEvent(organizationId: string, event: string, sprintId?: string) {
    this.sprintGateway.emitOrganizationEvent(organizationId, event, {
      sprintId,
      at: new Date().toISOString(),
    });
  }

  private startOfDay(date: Date) {
    const value = new Date(date);
    value.setUTCHours(0, 0, 0, 0);
    return value;
  }

  private parseLabels(labels: Prisma.JsonValue | null) {
    if (!Array.isArray(labels)) {
      return [] as Array<{ name: string; color?: string | null }>;
    }

    return labels.flatMap((entry) => {
      if (typeof entry === 'string') {
        return [{ name: entry }];
      }
      if (entry && typeof entry === 'object' && 'name' in entry) {
        const value = entry as Record<string, unknown>;
        return [
          {
            name: typeof value.name === 'string' ? value.name : 'Label',
            color: typeof value.color === 'string' ? value.color : null,
          },
        ];
      }
      return [];
    });
  }

  private mapTask(task: HydratedTask) {
    return {
      id: task.id,
      code: task.code ?? `PS-${task.id.slice(-4).toUpperCase()}`,
      projectId: task.projectId,
      title: task.title,
      description: task.description,
      state: task.status ?? task.state,
      status: task.status ?? task.state,
      priority: task.priority,
      storyPoints: task.storyPoints ?? task.story?.storyPoints ?? 0,
      sortOrder: task.sortOrder,
      position: task.position,
      blockedReason: task.blockedReason,
      labels: this.parseLabels(task.labels),
      assignees: task.assignees.map(({ user }) => ({
        id: user.id,
        name: user.name,
        avatarUrl: user.avatarUrl,
      })),
      dependencies: task.blockedByDependencies.map((dependency) => ({
        taskId: dependency.blocker.id,
        title: dependency.blocker.title,
        critical: dependency.critical,
        state: dependency.blocker.state,
      })),
      epic: task.story?.epic
        ? {
            id: task.story.epic.id,
            name: task.story.epic.name,
            color: task.story.epic.color,
          }
        : null,
      sprintId: task.sprintId,
      sprintTaskId: task.sprintTasks[0]?.id ?? null,
      position: task.sprintTasks[0]?.position ?? task.sortOrder,
      isBlocked: this.isTaskBlocked(task),
      isDone: task.state === TaskState.DONE,
      dueAt: task.dueAt ? task.dueAt.toISOString() : null,
      dueDate: task.dueDate ? task.dueDate.toISOString() : null,
      updatedAt: task.updatedAt.toISOString(),
    };
  }

  private mapSprint(sprint: HydratedSprint) {
    const warnings = [
      ...(sprint.velocity > 0 && sprint.storyPoints > sprint.velocity
        ? ['Story points acima da velocity histórica']
        : []),
      ...(sprint.capacity > 0 && sprint.storyPoints > sprint.capacity
        ? ['Story points acima da capacidade disponível']
        : []),
    ];

    return {
      id: sprint.id,
      projectId: sprint.projectId,
      name: sprint.name,
      goal: sprint.goal,
      objective: sprint.objective,
      notes: sprint.notes,
      status: sprint.status,
      startDate: sprint.startDate ? sprint.startDate.toISOString() : null,
      endDate: sprint.endDate ? sprint.endDate.toISOString() : null,
      capacity: sprint.capacity,
      velocity: sprint.velocity,
      targetVelocity: sprint.velocity,
      storyPoints: sprint.storyPoints,
      completedPoints: sprint.completedPoints,
      remainingPoints: sprint.remainingPoints,
      blockedPoints: sprint.blockedPoints,
      progress: sprint.storyPoints > 0 ? Math.round((sprint.completedPoints / sprint.storyPoints) * 100) : 0,
      healthScore: sprint.healthScore,
      completedAt: sprint.completedAt ? sprint.completedAt.toISOString() : null,
      createdAt: sprint.createdAt.toISOString(),
      updatedAt: sprint.updatedAt.toISOString(),
      memberCount: sprint.members.length,
      tasks: sprint.tasks.map((task) => this.mapTask(task)),
      members: sprint.members.map((member) => ({
        userId: member.userId,
        name: member.user.name,
        avatarUrl: member.user.avatarUrl,
        dailyCapacity: member.dailyCapacity,
        availabilityPercent: member.availabilityPercent,
        totalCapacity: member.totalCapacity,
      })),
      warnings,
    };
  }

  private mapMetric(metric: HydratedSprint['metrics'][number]) {
    return {
      id: metric.id,
      createdAt: metric.createdAt.toISOString(),
      totalStoryPoints: metric.totalStoryPoints,
      completedPoints: metric.completedPoints,
      remainingPoints: metric.remainingPoints,
      blockedPoints: metric.blockedPoints,
      progress: metric.progress,
      velocity: metric.velocity,
      throughput: metric.throughput,
      capacityUtilization: metric.capacityUtilization,
      healthScore: metric.healthScore,
    };
  }

  private mapBurndown(snapshot: HydratedSprint['snapshots'][number]) {
    return {
      id: snapshot.id,
      snapshotDate: snapshot.snapshotDate.toISOString(),
      remainingPoints: snapshot.remainingPoints,
      completedPoints: snapshot.completedPoints,
      blockedTasks: snapshot.blockedTasks,
    };
  }

  private mapHistory(entry: HydratedSprint['auditLogs'][number]) {
    return {
      id: entry.id,
      action: entry.action,
      actorId: entry.actorId,
      actorName: entry.actor?.name ?? null,
      createdAt: entry.createdAt.toISOString(),
      metadata: this.parseObject(entry.metadata),
    };
  }

  private parseObject(value: Prisma.JsonValue | null) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }

    return value as Record<string, unknown>;
  }
}
