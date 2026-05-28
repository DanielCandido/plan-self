import { BadRequestException, Injectable } from '@nestjs/common';
import type { CurrentUserPayload } from '../auth/types/current-user.type';
import { SprintService } from '../sprints/sprint.service';
import { PrismaService } from '../prisma/prisma.service';
import { SprintGateway } from '../sprints/sprint.gateway';
import type { KanbanBacklogQueryDto } from './dto/backlog-query.dto';
import type { PrioritizeBacklogDto } from './dto/prioritize-backlog.dto';

@Injectable()
export class KanbanService {
  constructor(
    private readonly sprintService: SprintService,
    private readonly prisma: PrismaService,
    private readonly sprintGateway: SprintGateway,
  ) {}

  async getBacklog(currentUser: CurrentUserPayload, query: KanbanBacklogQueryDto) {
    return this.sprintService.getBacklog(query.projectId, currentUser, query);
  }

  async prioritizeBacklog(currentUser: CurrentUserPayload, dto: PrioritizeBacklogDto) {
    const tasks = await this.prisma.task.findMany({
      where: {
        id: { in: dto.orderedTaskIds },
        projectId: dto.projectId,
        sprintId: null,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (tasks.length !== dto.orderedTaskIds.length) {
      throw new BadRequestException('Lista de priorização contém tasks inválidas');
    }

    await this.prisma.$transaction(
      dto.orderedTaskIds.map((taskId, index) =>
        this.prisma.task.update({
          where: { id: taskId },
          data: {
            position: index,
            sortOrder: index,
            updatedBy: currentUser.id,
          },
        }),
      ),
    );

    this.sprintGateway.emitOrganizationEvent(currentUser.organizationId, 'task.updated', {
      projectId: dto.projectId,
      reason: 'backlog.prioritized',
    });

    return { ok: true };
  }
}
