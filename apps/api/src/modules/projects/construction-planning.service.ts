import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateWeeklyPlanDto, CreateWeeklyPlanItemDto, UpdateWeeklyPlanItemDto } from './dto/weekly-plan.dto';

@Injectable()
export class ConstructionPlanningService {
  constructor(private readonly prisma: PrismaService) {}

  async list(projectId: string, organizationId: string) {
    await this.assertConstructionProject(projectId, organizationId);
    const plans = await this.prisma.weeklyPlan.findMany({
      where: { projectId },
      include: { items: { include: { wbsNode: { select: { code: true, name: true } }, task: { select: { id: true, code: true, title: true } } }, orderBy: { createdAt: 'asc' } } },
      orderBy: { weekStart: 'desc' },
    });
    return plans.map((plan) => {
      const completed = plan.items.filter((item) => item.status === 'DONE').length;
      return { ...plan, ppc: plan.items.length ? Math.round((completed / plan.items.length) * 100) : 0 };
    });
  }

  async create(projectId: string, organizationId: string, userId: string, dto: CreateWeeklyPlanDto) {
    await this.assertConstructionProject(projectId, organizationId);
    const weekStart = new Date(dto.weekStart);
    if (weekStart.getUTCDay() !== 1) throw new BadRequestException('O planejamento semanal deve iniciar em uma segunda-feira');
    return this.prisma.weeklyPlan.create({ data: { projectId, weekStart, notes: dto.notes, createdById: userId } });
  }

  async addItem(projectId: string, planId: string, organizationId: string, dto: CreateWeeklyPlanItemDto) {
    const plan = await this.findPlan(projectId, planId, organizationId);
    if (plan.status === 'CLOSED') throw new BadRequestException('Planejamento encerrado nao pode ser alterado');
    if (dto.wbsNodeId && !(await this.prisma.wbsNode.findFirst({ where: { id: dto.wbsNodeId, projectId } }))) throw new BadRequestException('Item da EAP nao pertence a obra');
    if (dto.taskId && !(await this.prisma.task.findFirst({ where: { id: dto.taskId, projectId } }))) throw new BadRequestException('Tarefa nao pertence a obra');
    return this.prisma.weeklyPlanItem.create({ data: { weeklyPlanId: plan.id, wbsNodeId: dto.wbsNodeId, taskId: dto.taskId, description: dto.description, unit: dto.unit ?? 'un', plannedQuantity: dto.plannedQuantity, constraintNote: dto.constraintNote } });
  }

  async updateItem(projectId: string, planId: string, itemId: string, organizationId: string, dto: UpdateWeeklyPlanItemDto) {
    const plan = await this.findPlan(projectId, planId, organizationId);
    if (plan.status === 'CLOSED') throw new BadRequestException('Planejamento encerrado nao pode ser alterado');
    const item = await this.prisma.weeklyPlanItem.findFirst({ where: { id: itemId, weeklyPlanId: plan.id } });
    if (!item) throw new NotFoundException('Meta semanal nao encontrada');
    const actual = dto.actualQuantity ?? item.actualQuantity;
    const planned = dto.plannedQuantity ?? item.plannedQuantity;
    const status = dto.status ?? (planned > 0 && actual >= planned ? 'DONE' : actual > 0 ? 'IN_PROGRESS' : item.status);
    return this.prisma.weeklyPlanItem.update({ where: { id: item.id }, data: { ...dto, status } });
  }

  async close(projectId: string, planId: string, organizationId: string) {
    const plan = await this.findPlan(projectId, planId, organizationId);
    return this.prisma.weeklyPlan.update({ where: { id: plan.id }, data: { status: 'CLOSED' } });
  }

  private async findPlan(projectId: string, planId: string, organizationId: string) {
    await this.assertConstructionProject(projectId, organizationId);
    const plan = await this.prisma.weeklyPlan.findFirst({ where: { id: planId, projectId } });
    if (!plan) throw new NotFoundException('Planejamento semanal nao encontrado');
    return plan;
  }

  private async assertConstructionProject(projectId: string, organizationId: string) {
    const project = await this.prisma.project.findFirst({ where: { id: projectId, organizationId, profile: 'CONSTRUCTION_SITE' }, select: { id: true } });
    if (!project) throw new NotFoundException('Obra nao encontrada');
  }
}
