import { BadRequestException, Injectable } from '@nestjs/common';
import { ProjectsRepository } from './projects.repository';
import type { CurrentUserPayload } from '../auth/types/current-user.type';

@Injectable()
export class ProjectsService {
  constructor(private readonly repository: ProjectsRepository) {}

  async listProjects(organizationId: string, query: { page?: number; perPage?: number; q?: string; teamId?: string }) {
    const page = query.page ?? 0;
    const perPage = query.perPage ?? 12;
    const search = query.q ?? '';
    const teamId = query.teamId;

    return this.repository.listProjects(organizationId, { page, perPage, search, teamId });
  }

  async getCounts(organizationId: string) {
    return this.repository.getCounts(organizationId);
  }

  async createProject(currentUser: CurrentUserPayload, dto: any) {
    const project = await this.repository.createProject(currentUser.organizationId, dto);
    return project;
  }

  async updateProject(projectId: string, currentUser: CurrentUserPayload, dto: any) {
    // business rule: cannot mark completed unless progress == 100 or admin
    if (dto.status === 'COMPLETED') {
      const progress = await this.repository.computeProgress(projectId, currentUser.organizationId);
      if (progress < 100 && currentUser.role !== 'ADMIN') {
        throw new BadRequestException('Não é possível marcar como concluído enquanto o progresso < 100%');
      }
    }

    const updated = await this.repository.updateProject(projectId, currentUser.organizationId, dto);
    return updated;
  }

  async setArchived(projectId: string, currentUser: CurrentUserPayload, archive: boolean) {
    if (archive) {
      const progress = await this.repository.computeProgress(projectId, currentUser.organizationId);
      if (progress < 100 && currentUser.role !== 'ADMIN') {
        throw new BadRequestException('Somente projetos concluídos ou administradores podem arquivar');
      }
    }

    return this.repository.setArchived(projectId, currentUser.organizationId, archive);
  }
}
