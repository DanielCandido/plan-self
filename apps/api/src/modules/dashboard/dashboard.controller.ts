import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/types/current-user.type';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DashboardResponseDto } from './dto/dashboard-response.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { CreateDashboardTaskDto } from './dto/create-dashboard-task.dto';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Retorna visão geral do dashboard' })
  getOverview(@CurrentUser() currentUser: CurrentUserPayload): Promise<DashboardResponseDto> {
    return this.dashboardService.getOverview(currentUser);
  }

  @Post('tasks')
  @ApiOperation({ summary: 'Cria task rápida para o dashboard' })
  createTask(
    @CurrentUser() currentUser: CurrentUserPayload,
    @Body() dto: CreateDashboardTaskDto,
  ) {
    return this.dashboardService.createTask(currentUser, dto);
  }

  @Patch('tasks/:taskId/status')
  @ApiOperation({ summary: 'Atualiza status da task e publica eventos realtime' })
  updateTaskStatus(
    @CurrentUser() currentUser: CurrentUserPayload,
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskStatusDto,
  ) {
    return this.dashboardService.updateTaskStatus(currentUser, taskId, dto);
  }
}
