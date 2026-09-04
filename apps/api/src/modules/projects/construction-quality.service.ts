import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateInspectionDto, CreateNonConformityDto, UpdateNonConformityDto } from './dto/construction-quality.dto';

@Injectable()
export class ConstructionQualityService {
  constructor(private readonly prisma: PrismaService) {}

  async listInspections(projectId: string, organizationId: string) {
    await this.assertProject(projectId, organizationId);
    return this.prisma.constructionInspection.findMany({
      where: { projectId },
      include: { inspector: { select: { id: true, name: true } }, nonConformities: { orderBy: { createdAt: 'desc' } } },
      orderBy: { inspectionDate: 'desc' },
    });
  }

  async createInspection(projectId: string, organizationId: string, inspectorId: string, dto: CreateInspectionDto) {
    await this.assertProject(projectId, organizationId);
    return this.prisma.constructionInspection.create({
      data: { projectId, inspectorId, title: dto.title, type: dto.type, inspectionDate: new Date(dto.inspectionDate), location: dto.location, checklist: dto.checklist as Prisma.InputJsonValue, notes: dto.notes, status: dto.status ?? 'OPEN' },
      include: { inspector: { select: { id: true, name: true } }, nonConformities: true },
    });
  }

  async listNonConformities(projectId: string, organizationId: string) {
    await this.assertProject(projectId, organizationId);
    return this.prisma.nonConformity.findMany({ where: { projectId }, include: { responsible: { select: { id: true, name: true } }, inspection: { select: { id: true, title: true } } }, orderBy: { createdAt: 'desc' } });
  }

  async createNonConformity(projectId: string, organizationId: string, dto: CreateNonConformityDto) {
    await this.assertProject(projectId, organizationId);
    if (dto.inspectionId && !(await this.prisma.constructionInspection.findFirst({ where: { id: dto.inspectionId, projectId } }))) throw new NotFoundException('Inspecao nao encontrada');
    return this.prisma.nonConformity.create({ data: { projectId, inspectionId: dto.inspectionId, code: dto.code, title: dto.title, description: dto.description, severity: dto.severity ?? 'MEDIUM', responsibleId: dto.responsibleId, dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined } });
  }

  async updateNonConformity(projectId: string, id: string, organizationId: string, dto: UpdateNonConformityDto) {
    await this.assertProject(projectId, organizationId);
    if (!(await this.prisma.nonConformity.findFirst({ where: { id, projectId } }))) throw new NotFoundException('Nao conformidade nao encontrada');
    return this.prisma.nonConformity.update({ where: { id }, data: { status: dto.status, responsibleId: dto.responsibleId, dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined, resolution: dto.resolution, resolvedAt: dto.status === 'RESOLVED' || dto.status === 'CLOSED' ? new Date() : dto.status ? null : undefined } });
  }

  private async assertProject(projectId: string, organizationId: string) {
    if (!(await this.prisma.project.findFirst({ where: { id: projectId, organizationId, profile: 'CONSTRUCTION_SITE' }, select: { id: true } }))) throw new NotFoundException('Obra nao encontrada');
  }
}
