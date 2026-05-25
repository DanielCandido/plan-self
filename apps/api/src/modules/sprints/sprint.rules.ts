import { BadRequestException, ForbiddenException } from '@nestjs/common';
import type { Role, SprintStatus, TaskState } from '@prisma/client';

export interface CapacityMemberInput {
  dailyCapacity: number;
  availabilityPercent: number;
}

export interface SprintMetricTaskInput {
  state: TaskState;
  storyPoints: number;
  isBlocked: boolean;
}

const MANAGE_ROLES: Role[] = ['OWNER', 'ADMIN', 'MANAGER'];
const MOVE_ANY_ROLES: Role[] = ['OWNER', 'ADMIN', 'MANAGER'];

export function canManageSprint(role: Role): boolean {
  return MANAGE_ROLES.includes(role);
}

export function canMoveTask(role: Role, ownsTask: boolean): boolean {
  if (MOVE_ANY_ROLES.includes(role)) {
    return true;
  }

  if (role === 'MEMBER') {
    return ownsTask;
  }

  return false;
}

export function assertCanManageSprint(role: Role) {
  if (!canManageSprint(role)) {
    throw new ForbiddenException('Você não possui permissão para gerenciar sprints');
  }
}

export function assertSprintMutable(status: SprintStatus) {
  if (status === 'COMPLETED') {
    throw new BadRequestException('Sprint concluída está bloqueada para edição');
  }

  if (status === 'CANCELLED') {
    throw new BadRequestException('Sprint cancelada está bloqueada para edição');
  }
}

export function calculateDurationDays(startDate: Date, endDate: Date): number {
  const diff = endDate.getTime() - startDate.getTime();
  return Math.ceil(diff / 86_400_000);
}

export function validateSprintWindow(
  startDate: Date,
  endDate: Date,
  now: Date,
  maxDurationDays = 21,
) {
  if (startDate >= endDate) {
    throw new BadRequestException('A sprint precisa possuir um intervalo válido');
  }

  const durationDays = calculateDurationDays(startDate, endDate);
  if (durationDays < 1) {
    throw new BadRequestException('A sprint precisa ter pelo menos 1 dia de duração');
  }

  if (durationDays > maxDurationDays) {
    throw new BadRequestException(`A sprint não pode ultrapassar ${maxDurationDays} dias`);
  }

  const normalizedStart = new Date(startDate.toISOString());
  const normalizedNow = new Date(now.toISOString());
  if (normalizedStart.getTime() < normalizedNow.getTime()) {
    throw new BadRequestException('A sprint não pode iniciar no passado');
  }

  return durationDays;
}

export function calculateCapacity(durationDays: number, members: CapacityMemberInput[]): number {
  return members.reduce((sum, member) => {
    const availability = Math.max(0, Math.min(100, member.availabilityPercent)) / 100;
    return sum + Math.round(member.dailyCapacity * durationDays * availability);
  }, 0);
}

export function calculateVelocity(previousCompletedPoints: number[]): number {
  if (previousCompletedPoints.length === 0) {
    return 0;
  }

  return Math.round(
    previousCompletedPoints.reduce((sum, value) => sum + value, 0) / previousCompletedPoints.length,
  );
}

export function computeSprintMetrics(tasks: SprintMetricTaskInput[], capacity: number, velocity: number) {
  const totalStoryPoints = tasks.reduce((sum, task) => sum + task.storyPoints, 0);
  const completedPoints = tasks
    .filter((task) => task.state === 'DONE')
    .reduce((sum, task) => sum + task.storyPoints, 0);
  const blockedPoints = tasks
    .filter((task) => task.isBlocked)
    .reduce((sum, task) => sum + task.storyPoints, 0);
  const remainingPoints = Math.max(0, totalStoryPoints - completedPoints);
  const progress = totalStoryPoints > 0 ? Math.round((completedPoints / totalStoryPoints) * 100) : 0;
  const throughput = tasks.filter((task) => task.state === 'DONE').length;
  const capacityUtilization = capacity > 0 ? Number((totalStoryPoints / capacity).toFixed(2)) : 0;

  const overCapacityPenalty = totalStoryPoints > capacity && capacity > 0 ? 18 : 0;
  const overVelocityPenalty = totalStoryPoints > velocity && velocity > 0 ? 12 : 0;
  const blockedPenalty = tasks.length > 0 ? Math.round((blockedPoints / Math.max(1, totalStoryPoints)) * 30) : 0;
  const unfinishedPenalty = 100 - progress > 0 ? Math.round((100 - progress) * 0.25) : 0;

  const healthScore = Math.max(
    0,
    Math.min(100, 100 - overCapacityPenalty - overVelocityPenalty - blockedPenalty - unfinishedPenalty),
  );

  return {
    totalStoryPoints,
    completedPoints,
    remainingPoints,
    blockedPoints,
    progress,
    throughput,
    capacityUtilization,
    healthScore,
    warnings: [
      ...(velocity > 0 && totalStoryPoints > velocity ? ['Story points acima da velocity histórica'] : []),
      ...(capacity > 0 && totalStoryPoints > capacity ? ['Sprint acima da capacidade disponível'] : []),
    ],
  };
}
