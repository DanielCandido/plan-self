import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { CurrentUserPayload } from '../auth/types/current-user.type';
import type { KanbanBacklogQueryDto } from './dto/backlog-query.dto';
import type { PrioritizeBacklogDto } from './dto/prioritize-backlog.dto';
import { KanbanService } from './kanban.service';

@ApiTags('kanban')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class KanbanController {
  constructor(private readonly kanbanService: KanbanService) {}

  @Get('backlog')
  @ApiOperation({ summary: 'Retorna backlog padronizado do projeto' })
  getBacklog(@CurrentUser() currentUser: CurrentUserPayload, @Query() query: KanbanBacklogQueryDto) {
    return this.kanbanService.getBacklog(currentUser, query);
  }

  @Post('backlog/prioritize')
  @Roles('OWNER', 'ADMIN', 'MANAGER', 'MEMBER')
  @ApiOperation({ summary: 'Prioriza backlog com ordenação persistente' })
  prioritizeBacklog(@CurrentUser() currentUser: CurrentUserPayload, @Body() dto: PrioritizeBacklogDto) {
    return this.kanbanService.prioritizeBacklog(currentUser, dto);
  }
}
