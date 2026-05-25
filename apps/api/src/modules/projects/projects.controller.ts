import { Controller, Get, Query, UseGuards, Post, Body, Patch, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/types/current-user.type';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProjectsService } from './projects.service';
import { ListProjectsQueryDto } from './dto/projects-list-query.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ArchiveProjectDto } from './dto/archive-project.dto';

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get('projects')
  @ApiOperation({ summary: 'Lista de projetos com paginação e filtros simples' })
  listProjects(@CurrentUser() currentUser: CurrentUserPayload, @Query() query: ListProjectsQueryDto) {
    return this.projectsService.listProjects(currentUser.organizationId, query as any);
  }

  @Get('projects/counts')
  @ApiOperation({ summary: 'Retorna contagens agregadas para a visão de Projects' })
  getCounts(@CurrentUser() currentUser: CurrentUserPayload) {
    return this.projectsService.getCounts(currentUser.organizationId);
  }

  @Post('projects')
  @ApiOperation({ summary: 'Cria um novo projeto' })
  createProject(@CurrentUser() currentUser: CurrentUserPayload, @Body() dto: CreateProjectDto) {
    return this.projectsService.createProject(currentUser, dto as any);
  }

  @Patch('projects/:id')
  @ApiOperation({ summary: 'Atualiza um projeto' })
  updateProject(@Param('id') id: string, @CurrentUser() currentUser: CurrentUserPayload, @Body() dto: UpdateProjectDto) {
    return this.projectsService.updateProject(id, currentUser, dto as any);
  }

  @Post('projects/:id/archive')
  @ApiOperation({ summary: 'Arquiva ou desarquiva um projeto' })
  archiveProject(@Param('id') id: string, @CurrentUser() currentUser: CurrentUserPayload, @Body() dto: ArchiveProjectDto) {
    return this.projectsService.setArchived(id, currentUser, dto.archive);
  }
}
