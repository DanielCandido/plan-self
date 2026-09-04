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
import { ConstructionPlanningService } from './construction-planning.service';
import { CreateWeeklyPlanDto, CreateWeeklyPlanItemDto, UpdateWeeklyPlanItemDto } from './dto/weekly-plan.dto';
import { SiteDiaryService } from './site-diary.service';
import { SaveSiteDiaryDto } from './dto/site-diary.dto';
import { ConstructionQualityService } from './construction-quality.service';
import { CreateInspectionDto, CreateNonConformityDto, UpdateNonConformityDto } from './dto/construction-quality.dto';

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService, private readonly projectFiles: ProjectFilesService, private readonly constructionPlanning: ConstructionPlanningService, private readonly siteDiary: SiteDiaryService, private readonly constructionQuality: ConstructionQualityService) {}

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

  @Get('projects/:id/weekly-plans')
  listWeeklyPlans(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.constructionPlanning.list(id, user.organizationId);
  }

  @Post('projects/:id/weekly-plans')
  createWeeklyPlan(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload, @Body() dto: CreateWeeklyPlanDto) {
    return this.constructionPlanning.create(id, user.organizationId, user.id, dto);
  }

  @Post('projects/:id/weekly-plans/:planId/items')
  addWeeklyPlanItem(@Param('id') id: string, @Param('planId') planId: string, @CurrentUser() user: CurrentUserPayload, @Body() dto: CreateWeeklyPlanItemDto) {
    return this.constructionPlanning.addItem(id, planId, user.organizationId, dto);
  }

  @Patch('projects/:id/weekly-plans/:planId/items/:itemId')
  updateWeeklyPlanItem(@Param('id') id: string, @Param('planId') planId: string, @Param('itemId') itemId: string, @CurrentUser() user: CurrentUserPayload, @Body() dto: UpdateWeeklyPlanItemDto) {
    return this.constructionPlanning.updateItem(id, planId, itemId, user.organizationId, dto);
  }

  @Post('projects/:id/weekly-plans/:planId/close')
  closeWeeklyPlan(@Param('id') id: string, @Param('planId') planId: string, @CurrentUser() user: CurrentUserPayload) {
    return this.constructionPlanning.close(id, planId, user.organizationId);
  }

  @Get('projects/:id/site-diaries')
  listSiteDiaries(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.siteDiary.list(id, user.organizationId);
  }

  @Post('projects/:id/site-diaries')
  saveSiteDiary(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload, @Body() dto: SaveSiteDiaryDto) {
    return this.siteDiary.save(id, user.organizationId, user.id, dto);
  }

  @Post('projects/:id/site-diaries/:diaryId/photos')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 15 * 1024 * 1024 } }))
  addSiteDiaryPhoto(@Param('id') id: string, @Param('diaryId') diaryId: string, @CurrentUser() user: CurrentUserPayload, @UploadedFile() file: any, @Body('caption') caption?: string) {
    return this.siteDiary.addPhoto(id, diaryId, user.organizationId, file, caption);
  }

  @Get('projects/:id/site-diaries/:diaryId/photos/:photoId')
  async getSiteDiaryPhoto(@Param('id') id: string, @Param('diaryId') diaryId: string, @Param('photoId') photoId: string, @CurrentUser() user: CurrentUserPayload, @Res({ passthrough: true }) response: any) {
    const result = await this.siteDiary.photo(id, diaryId, photoId, user.organizationId);
    response.setHeader('Content-Type', result.photo.mimeType);
    response.setHeader('Content-Length', String(result.photo.size));
    return new StreamableFile(result.stream);
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

  @Get('projects/:id/inspections')
  listInspections(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.constructionQuality.listInspections(id, user.organizationId);
  }

  @Post('projects/:id/inspections')
  createInspection(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload, @Body() dto: CreateInspectionDto) {
    return this.constructionQuality.createInspection(id, user.organizationId, user.id, dto);
  }

  @Get('projects/:id/non-conformities')
  listNonConformities(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.constructionQuality.listNonConformities(id, user.organizationId);
  }

  @Post('projects/:id/non-conformities')
  createNonConformity(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload, @Body() dto: CreateNonConformityDto) {
    return this.constructionQuality.createNonConformity(id, user.organizationId, dto);
  }

  @Patch('projects/:id/non-conformities/:nonConformityId')
  updateNonConformity(@Param('id') id: string, @Param('nonConformityId') nonConformityId: string, @CurrentUser() user: CurrentUserPayload, @Body() dto: UpdateNonConformityDto) {
    return this.constructionQuality.updateNonConformity(id, nonConformityId, user.organizationId, dto);
  }
}
