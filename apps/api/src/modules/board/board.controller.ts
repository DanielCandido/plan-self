import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUserPayload } from '../auth/types/current-user.type';
import { MoveBoardTaskDto } from './dto/move-board-task.dto';
import { ReorderBoardTaskDto } from './dto/reorder-board-task.dto';
import { BoardService } from './board.service';

@ApiTags('boards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('boards')
export class BoardController {
  constructor(private readonly boardService: BoardService) {}

  @Get(':projectId')
  @ApiOperation({ summary: 'Retorna board kanban com colunas e tasks' })
  getBoard(@CurrentUser() currentUser: CurrentUserPayload, @Param('projectId') projectId: string) {
    return this.boardService.getBoard(currentUser, projectId);
  }

  @Patch('tasks/reorder')
  @Roles('OWNER', 'ADMIN', 'MANAGER', 'MEMBER')
  @ApiOperation({ summary: 'Reordena tasks dentro de uma coluna' })
  reorderTasks(@CurrentUser() currentUser: CurrentUserPayload, @Body() dto: ReorderBoardTaskDto) {
    return this.boardService.reorderTasks(currentUser, dto);
  }

  @Patch('tasks/move')
  @Roles('OWNER', 'ADMIN', 'MANAGER', 'MEMBER')
  @ApiOperation({ summary: 'Move task entre colunas do board' })
  moveTask(@CurrentUser() currentUser: CurrentUserPayload, @Body() dto: MoveBoardTaskDto) {
    console.log(dto);
    return this.boardService.moveTask(currentUser, dto);
  }
}
