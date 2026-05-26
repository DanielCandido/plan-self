import { BadRequestException, Injectable } from '@nestjs/common';
import { ProjectsRepository } from './projects.repository';
import type { CurrentUserPayload } from '../auth/types/current-user.type';

@Injectable()
export class ProjectsService {
  constructor(private readonly repository: ProjectsRepository) {}

  async listProjects(
    organizationId: string,
    query: {
      page?: number;
      perPage?: number;
      q?: string;
      teamId?: string;
      ownerId?: string;
      status?: string;
      priority?: string;
      sortBy?: string;
      order?: 'asc' | 'desc';
    },
  ) {
    const page = query.page ?? 0;
    const perPage = query.perPage ?? 12;
    const search = query.q ?? '';
    const teamId = query.teamId;
    const ownerId = query.ownerId;
    const status = query.status;
    const priority = query.priority;
    const sortBy = query.sortBy;
    const order = query.order ?? 'desc';

    return this.repository.listProjects(organizationId, { page, perPage, search, teamId, ownerId, status, priority, sortBy, order });
  }

  async findById(projectId: string, organizationId: string) {
    return this.repository.findById(projectId, organizationId);
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

  async listProjectMembers(projectId: string, currentUser: CurrentUserPayload) {
    return this.repository.listProjectMembers(projectId, currentUser.organizationId);
  }

  async addProjectMember(projectId: string, currentUser: CurrentUserPayload, dto: { userId: string; role?: string }) {
    return this.repository.addProjectMember(projectId, currentUser.organizationId, dto);
  }

  async removeProjectMember(projectId: string, userId: string, currentUser: CurrentUserPayload) {
    return this.repository.removeProjectMember(projectId, currentUser.organizationId, userId);
  }

  async listAvailableProjectUsers(projectId: string, currentUser: CurrentUserPayload, search: string) {
    return this.repository.listAvailableProjectUsers(projectId, currentUser.organizationId, search);
  }

  async listProjectTasks(
    projectId: string,
    currentUser: CurrentUserPayload,
    query: { page?: number; perPage?: number; q?: string; state?: string; priority?: string; assigneeId?: string },
  ) {
    return this.repository.listProjectTasks(projectId, currentUser.organizationId, {
      page: query.page ?? 0,
      perPage: query.perPage ?? 20,
      search: query.q ?? '',
      state: query.state,
      priority: query.priority,
      assigneeId: query.assigneeId,
    });
  }

  async createProjectTask(
    projectId: string,
    currentUser: CurrentUserPayload,
    dto: {
      title: string;
      description?: string;
      priority?: string;
      storyPoints?: number;
      dueAt?: string;
      assigneeIds?: string[];
    },
  ) {
    return this.repository.createProjectTask(projectId, currentUser.organizationId, dto);
  }
}
