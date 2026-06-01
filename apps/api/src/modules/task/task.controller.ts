import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { CurrentUserPayload } from '../auth/types/current-user.type';
import type { CreateTaskCommentDto } from './dto/create-task-comment.dto';
import type { CreateTaskDto } from './dto/create-task.dto';
import type { CreateLabelDto, LabelQueryDto } from './dto/task-label.dto';
import type { TaskQueryDto } from './dto/task-query.dto';
import type { UpdateTaskRestDto } from './dto/update-task.dto';
import { TaskService } from './task.service';

@ApiTags('tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Get('tasks')
  @ApiOperation({ summary: 'Lista tasks com filtros por projeto e coluna' })
  listTasks(@CurrentUser() currentUser: CurrentUserPayload, @Query() query: TaskQueryDto) {
    return this.taskService.listTasks(currentUser, query);
  }

  @Get('tasks/:id')
  @ApiOperation({ summary: 'Retorna detalhes de uma task' })
  getTask(@CurrentUser() currentUser: CurrentUserPayload, @Param('id') taskId: string) {
    return this.taskService.getTask(currentUser, taskId);
  }

  @Post('tasks')
  @Roles('OWNER', 'ADMIN', 'MANAGER', 'MEMBER')
  @ApiOperation({ summary: 'Cria task no fluxo kanban/sprint' })
  createTask(@CurrentUser() currentUser: CurrentUserPayload, @Body() dto: CreateTaskDto) {
    return this.taskService.createTask(currentUser, dto);
  }

  @Patch('tasks/:id')
  @Roles('OWNER', 'ADMIN', 'MANAGER', 'MEMBER')
  @ApiOperation({ summary: 'Atualiza task com controle de concorrência otimista' })
  updateTask(
    @CurrentUser() currentUser: CurrentUserPayload,
    @Param('id') taskId: string,
    @Body() dto: UpdateTaskRestDto,
  ) {
    return this.taskService.updateTask(currentUser, taskId, dto);
  }

  @Delete('tasks/:id')
  @Roles('OWNER', 'ADMIN', 'MANAGER', 'MEMBER')
  @ApiOperation({ summary: 'Soft delete da task' })
  deleteTask(@CurrentUser() currentUser: CurrentUserPayload, @Param('id') taskId: string) {
    return this.taskService.deleteTask(currentUser, taskId);
  }

  @Get('tasks/:id/comments')
  @ApiOperation({ summary: 'Lista comentários da task' })
  listComments(@CurrentUser() currentUser: CurrentUserPayload, @Param('id') taskId: string) {
    return this.taskService.listTaskComments(currentUser, taskId);
  }

  @Post('tasks/:id/comments')
  @Roles('OWNER', 'ADMIN', 'MANAGER', 'MEMBER')
  @ApiOperation({ summary: 'Cria comentário em uma task' })
  createComment(
    @CurrentUser() currentUser: CurrentUserPayload,
    @Param('id') taskId: string,
    @Body() dto: CreateTaskCommentDto,
  ) {
    return this.taskService.createTaskComment(currentUser, taskId, dto);
  }

  @Get('tasks/:id/activity')
  @ApiOperation({ summary: 'Retorna timeline de atividade da task (histórico + comentários)' })
  getTaskActivity(@CurrentUser() currentUser: CurrentUserPayload, @Param('id') taskId: string) {
    return this.taskService.getTaskActivity(currentUser, taskId);
  }

  @Delete('tasks/:id/comments/:commentId')
  @Roles('OWNER', 'ADMIN', 'MANAGER', 'MEMBER')
  @ApiOperation({ summary: 'Deleta comentário de uma task' })
  deleteComment(
    @CurrentUser() currentUser: CurrentUserPayload,
    @Param('id') taskId: string,
    @Param('commentId') commentId: string,
  ) {
    return this.taskService.deleteTaskComment(currentUser, taskId, commentId);
  }

  @Get('labels')
  @ApiOperation({ summary: 'Lista labels de um projeto' })
  listLabels(@CurrentUser() currentUser: CurrentUserPayload, @Query() query: LabelQueryDto) {
    return this.taskService.listLabels(currentUser, query);
  }

  @Post('labels')
  @Roles('OWNER', 'ADMIN', 'MANAGER', 'MEMBER')
  @ApiOperation({ summary: 'Cria label de projeto' })
  createLabel(@CurrentUser() currentUser: CurrentUserPayload, @Body() dto: CreateLabelDto) {
    return this.taskService.createLabel(currentUser, dto);
  }
}
