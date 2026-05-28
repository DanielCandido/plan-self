import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/types/current-user.type';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SprintService } from './sprint.service';
import { AddSprintTasksDto } from './dto/add-sprint-tasks.dto';
import { BacklogQueryDto } from './dto/backlog-query.dto';
import { CompleteSprintDto } from './dto/complete-sprint.dto';
import { CreateSprintDto } from './dto/create-sprint.dto';
import { CurrentSprintQueryDto } from './dto/current-sprint-query.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { ReorderTaskDto } from './dto/reorder-task.dto';
import { UpdateSprintDto } from './dto/update-sprint.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@ApiTags('sprints')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class SprintController {
  constructor(private readonly sprintService: SprintService) {}

  @Get('projects/:id/sprints')
  @ApiOperation({ summary: 'Retorna a visão principal de sprint e backlog do projeto' })
  getProjectSprints(@Param('id') projectId: string, @CurrentUser() currentUser: CurrentUserPayload) {
    return this.sprintService.getProjectBoard(projectId, currentUser);
  }

  @Get('projects/:id/sprints/active')
  @ApiOperation({ summary: 'Retorna a sprint ativa do projeto' })
  getActiveSprint(@Param('id') projectId: string, @CurrentUser() currentUser: CurrentUserPayload) {
    return this.sprintService.getActiveSprint(projectId, currentUser);
  }

  @Get('sprints/current')
  @ApiOperation({ summary: 'Retorna a sprint ativa atual (projeto opcional)' })
  getCurrentSprint(@Query() query: CurrentSprintQueryDto, @CurrentUser() currentUser: CurrentUserPayload) {
    return this.sprintService.getCurrentSprint(currentUser, query.projectId);
  }

  @Get('projects/:id/backlog')
  @ApiOperation({ summary: 'Retorna o backlog paginado do projeto' })
  getBacklog(
    @Param('id') projectId: string,
    @CurrentUser() currentUser: CurrentUserPayload,
    @Query() query: BacklogQueryDto,
  ) {
    return this.sprintService.getBacklog(projectId, currentUser, query);
  }

  @Post('sprints')
  @ApiOperation({ summary: 'Cria uma nova sprint para o projeto' })
  createSprint(@CurrentUser() currentUser: CurrentUserPayload, @Body() dto: CreateSprintDto) {
    return this.sprintService.createSprint(currentUser, dto);
  }

  @Patch('sprints/:id')
  @ApiOperation({ summary: 'Atualiza uma sprint' })
  updateSprint(
    @Param('id') sprintId: string,
    @CurrentUser() currentUser: CurrentUserPayload,
    @Body() dto: UpdateSprintDto,
  ) {
    return this.sprintService.updateSprint(sprintId, currentUser, dto);
  }

  @Delete('sprints/:id')
  @ApiOperation({ summary: 'Remove uma sprint' })
  deleteSprint(@Param('id') sprintId: string, @CurrentUser() currentUser: CurrentUserPayload) {
    return this.sprintService.deleteSprint(sprintId, currentUser);
  }

  @Post('sprints/:id/start')
  @ApiOperation({ summary: 'Inicia uma sprint em planejamento' })
  startSprint(@Param('id') sprintId: string, @CurrentUser() currentUser: CurrentUserPayload) {
    return this.sprintService.startSprint(sprintId, currentUser);
  }

  @Post('sprints/:id/complete')
  @ApiOperation({ summary: 'Conclui a sprint e processa carry over' })
  completeSprint(
    @Param('id') sprintId: string,
    @CurrentUser() currentUser: CurrentUserPayload,
    @Body() dto: CompleteSprintDto,
  ) {
    return this.sprintService.completeSprint(sprintId, currentUser, dto);
  }

  @Post('sprints/:id/cancel')
  @ApiOperation({ summary: 'Cancela a sprint' })
  cancelSprint(@Param('id') sprintId: string, @CurrentUser() currentUser: CurrentUserPayload) {
    return this.sprintService.cancelSprint(sprintId, currentUser);
  }

  @Post('sprints/:id/tasks')
  @ApiOperation({ summary: 'Adiciona tarefas ao escopo da sprint' })
  addSprintTasks(
    @Param('id') sprintId: string,
    @CurrentUser() currentUser: CurrentUserPayload,
    @Body() dto: AddSprintTasksDto,
  ) {
    return this.sprintService.addTasksToSprint(sprintId, currentUser, dto);
  }

  @Delete('sprints/:id/tasks/:taskId')
  @ApiOperation({ summary: 'Remove uma task da sprint e devolve ao backlog' })
  removeSprintTask(
    @Param('id') sprintId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.sprintService.removeTaskFromSprint(sprintId, taskId, currentUser);
  }

  @Patch('tasks/:id/reorder')
  @ApiOperation({ summary: 'Reordena tasks no backlog ou sprint' })
  reorderTask(
    @Param('id') taskId: string,
    @CurrentUser() currentUser: CurrentUserPayload,
    @Body() dto: ReorderTaskDto,
  ) {
    return this.sprintService.reorderTasks(taskId, currentUser, dto);
  }

  @Patch('tasks/:id/move')
  @ApiOperation({ summary: 'Move tasks entre backlog e sprint' })
  moveTask(
    @Param('id') taskId: string,
    @CurrentUser() currentUser: CurrentUserPayload,
    @Body() dto: MoveTaskDto,
  ) {
    return this.sprintService.moveTasks(taskId, currentUser, dto);
  }

  @Patch('tasks/:id')
  @ApiOperation({ summary: 'Atualiza rapidamente metadados da task' })
  updateTask(
    @Param('id') taskId: string,
    @CurrentUser() currentUser: CurrentUserPayload,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.sprintService.updateTask(taskId, currentUser, dto);
  }

  @Delete('tasks/:id')
  @ApiOperation({ summary: 'Exclui uma task do projeto' })
  deleteTask(@Param('id') taskId: string, @CurrentUser() currentUser: CurrentUserPayload) {
    return this.sprintService.deleteTask(taskId, currentUser);
  }

  @Get('sprints/:id/burndown')
  @ApiOperation({ summary: 'Retorna o burndown da sprint' })
  getBurndown(@Param('id') sprintId: string, @CurrentUser() currentUser: CurrentUserPayload) {
    return this.sprintService.getBurndown(sprintId, currentUser);
  }

  @Get('sprints/:id/metrics')
  @ApiOperation({ summary: 'Retorna as métricas históricas da sprint' })
  getMetrics(@Param('id') sprintId: string, @CurrentUser() currentUser: CurrentUserPayload) {
    return this.sprintService.getMetrics(sprintId, currentUser);
  }

  @Get('sprints/:id/history')
  @ApiOperation({ summary: 'Retorna o histórico auditável da sprint' })
  getHistory(@Param('id') sprintId: string, @CurrentUser() currentUser: CurrentUserPayload) {
    return this.sprintService.getHistory(sprintId, currentUser);
  }
}
