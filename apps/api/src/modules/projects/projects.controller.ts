import { Controller, Get, Query, UseGuards, UseInterceptors, UploadedFile, Post, Body, Patch, Param, Delete, Res, StreamableFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/types/current-user.type';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProjectsService } from './projects.service';
import { ListProjectsQueryDto } from './dto/projects-list-query.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ArchiveProjectDto } from './dto/archive-project.dto';
import { AddProjectMemberDto } from './dto/add-project-member.dto';
import { ListProjectTasksQueryDto } from './dto/list-project-tasks-query.dto';
import { CreateProjectTaskDto } from './dto/create-project-task.dto';
import { ListProjectUsersQueryDto } from './dto/list-project-users-query.dto';
import { ListProjectOptionsQueryDto } from './dto/list-project-options-query.dto';
import { UpdateProjectMemberDto } from './dto/update-project-member.dto';
import { ProjectFilesService } from './project-files.service';

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService, private readonly projectFiles: ProjectFilesService) {}

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

  @Get('projects/options/owners')
  @ApiOperation({ summary: 'Lista owners elegíveis para formulários de projeto' })
  listProjectOwnerOptions(
    @CurrentUser() currentUser: CurrentUserPayload,
    @Query() query: ListProjectOptionsQueryDto,
  ) {
    return this.projectsService.listProjectOwners(currentUser.organizationId, query.q, query.limit);
  }

  @Get('projects/options/teams')
  @ApiOperation({ summary: 'Lista equipes da organização para formulários de projeto' })
  listProjectTeamOptions(
    @CurrentUser() currentUser: CurrentUserPayload,
    @Query() query: ListProjectOptionsQueryDto,
  ) {
    return this.projectsService.listProjectTeams(currentUser.organizationId, query.q, query.limit);
  }

  @Get('projects/:id')
  @ApiOperation({ summary: 'Detalha um projeto com metadados de progresso' })
  getProjectById(@Param('id') id: string, @CurrentUser() currentUser: CurrentUserPayload) {
    return this.projectsService.findById(id, currentUser.organizationId);
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

  @Get('projects/:id/members')
  @ApiOperation({ summary: 'Lista membros com acesso ao projeto via equipe' })
  listProjectMembers(@Param('id') id: string, @CurrentUser() currentUser: CurrentUserPayload) {
    return this.projectsService.listProjectMembers(id, currentUser);
  }

  @Post('projects/:id/members')
  @ApiOperation({ summary: 'Adiciona membro ao acesso do projeto via equipe' })
  addProjectMember(
    @Param('id') id: string,
    @CurrentUser() currentUser: CurrentUserPayload,
    @Body() dto: AddProjectMemberDto,
  ) {
    return this.projectsService.addProjectMember(id, currentUser, dto);
  }

  @Get('projects/:id/users')
  @ApiOperation({ summary: 'Lista usuários ativos da organização para concessão de acesso ao projeto' })
  listProjectUsers(
    @Param('id') id: string,
    @CurrentUser() currentUser: CurrentUserPayload,
    @Query() query: ListProjectUsersQueryDto,
  ) {
    return this.projectsService.listAvailableProjectUsers(id, currentUser, query.q);
  }

  @Delete('projects/:id/members/:userId')
  @ApiOperation({ summary: 'Remove membro do acesso do projeto via equipe' })
  removeProjectMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.projectsService.removeProjectMember(id, userId, currentUser);
  }

  @Patch('projects/:id/members/:userId')
  @ApiOperation({ summary: 'Atualiza o papel de um membro no projeto' })
  updateProjectMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @CurrentUser() currentUser: CurrentUserPayload,
    @Body() dto: UpdateProjectMemberDto,
  ) {
    return this.projectsService.updateProjectMember(id, userId, currentUser, dto);
  }

  @Get('projects/:id/tasks')
  @ApiOperation({ summary: 'Lista tarefas do projeto com filtros e paginação' })
  listProjectTasks(
    @Param('id') id: string,
    @CurrentUser() currentUser: CurrentUserPayload,
    @Query() query: ListProjectTasksQueryDto,
  ) {
    return this.projectsService.listProjectTasks(id, currentUser, query);
  }

  @Post('projects/:id/tasks')
  @ApiOperation({ summary: 'Cria tarefa diretamente no contexto do projeto' })
  createProjectTask(
    @Param('id') id: string,
    @CurrentUser() currentUser: CurrentUserPayload,
    @Body() dto: CreateProjectTaskDto,
  ) {
    return this.projectsService.createProjectTask(id, currentUser, dto);
  }

  @Get('projects/:id/wbs')
  @ApiOperation({ summary: 'Lista a EAP do projeto' })
  listWbs(@Param('id') id: string, @CurrentUser() currentUser: CurrentUserPayload) {
    return this.projectsService.listWbs(id, currentUser);
  }

  @Get('projects/:id/timeline')
  @ApiOperation({ summary: 'Retorna EAP, tarefas planejadas e dependencias para o Gantt' })
  getTimeline(@Param('id') id: string, @CurrentUser() currentUser: CurrentUserPayload) {
    return this.projectsService.getTimeline(id, currentUser);
  }

  @Post('projects/:id/wbs')
  @ApiOperation({ summary: 'Cria um item na EAP do projeto' })
  createWbsNode(@Param('id') id: string, @CurrentUser() currentUser: CurrentUserPayload, @Body() dto: any) {
    return this.projectsService.createWbsNode(id, currentUser, dto);
  }

  @Patch('projects/:id/wbs/:nodeId')
  updateWbsNode(@Param('id') id: string, @Param('nodeId') nodeId: string, @CurrentUser() currentUser: CurrentUserPayload, @Body() dto: any) {
    return this.projectsService.updateWbsNode(id, nodeId, currentUser, dto);
  }

  @Delete('projects/:id/wbs/:nodeId')
  removeWbsNode(@Param('id') id: string, @Param('nodeId') nodeId: string, @CurrentUser() currentUser: CurrentUserPayload) {
    return this.projectsService.removeWbsNode(id, nodeId, currentUser);
  }

  @Post('projects/:id/dependencies')
  @ApiOperation({ summary: 'Cria uma dependencia entre tarefas do projeto' })
  createDependency(@Param('id') id: string, @CurrentUser() currentUser: CurrentUserPayload, @Body() dto: any) {
    return this.projectsService.createDependency(id, currentUser, dto);
  }

  @Delete('projects/:id/dependencies/:dependencyId')
  removeDependency(@Param('id') id: string, @Param('dependencyId') dependencyId: string, @CurrentUser() currentUser: CurrentUserPayload) {
    return this.projectsService.removeDependency(id, dependencyId, currentUser);
  }

  @Get('projects/:id/files')
  listFiles(@Param('id') id: string, @CurrentUser() currentUser: CurrentUserPayload) {
    return this.projectFiles.list(id, currentUser.organizationId);
  }

  @Post('projects/:id/files')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 50 * 1024 * 1024 } }))
  uploadFile(@Param('id') id: string, @CurrentUser() currentUser: CurrentUserPayload, @UploadedFile() file: any, @Body() body: any) {
    return this.projectFiles.create(id, currentUser.organizationId, currentUser.id, file, body);
  }

  @Post('projects/:id/files/:fileId/revisions')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 50 * 1024 * 1024 } }))
  uploadRevision(@Param('id') id: string, @Param('fileId') fileId: string, @CurrentUser() currentUser: CurrentUserPayload, @UploadedFile() file: any, @Body('note') note?: string) {
    return this.projectFiles.addRevision(id, fileId, currentUser.organizationId, currentUser.id, file, note);
  }

  @Get('projects/:id/files/:fileId/revisions/:revisionId/download')
  async downloadRevision(@Param('id') id: string, @Param('fileId') fileId: string, @Param('revisionId') revisionId: string, @CurrentUser() currentUser: CurrentUserPayload, @Res({ passthrough: true }) response: any) {
    const result = await this.projectFiles.download(id, fileId, revisionId, currentUser.organizationId);
    response.setHeader('Content-Type', result.revision.mimeType);
    response.setHeader('Content-Length', String(result.revision.size));
    response.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(result.revision.originalName)}`);
    return new StreamableFile(result.stream);
  }

  @Delete('projects/:id/files/:fileId')
  removeFile(@Param('id') id: string, @Param('fileId') fileId: string, @CurrentUser() currentUser: CurrentUserPayload) {
    return this.projectFiles.remove(id, fileId, currentUser.organizationId);
  }
}
