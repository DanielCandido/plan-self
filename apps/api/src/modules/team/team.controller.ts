import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { CurrentUserPayload } from '../auth/types/current-user.type';
import { AddTeamMemberDto } from './dto/add-team-member.dto';
import { ArchiveTeamDto } from './dto/archive-team.dto';
import { CreateTeamDto } from './dto/create-team.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { ListTeamsQueryDto } from './dto/list-teams-query.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { TeamMemberGuard, TeamPolicy } from './guards/team-member.guard';
import { TeamService } from './team.service';

@ApiTags('teams')
@Controller()
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Get('teams')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Lista times da organização com paginação' })
  listTeams(@CurrentUser() currentUser: CurrentUserPayload, @Query() query: ListTeamsQueryDto) {
    return this.teamService.listTeams(currentUser.organizationId, query);
  }

  @Get('teams/directory')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Lista diretório de membros da organização' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'perPage', required: false })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'role', required: false })
  @ApiQuery({ name: 'teamId', required: false })
  listDirectory(
    @CurrentUser() currentUser: CurrentUserPayload,
    @Query('page') page = '0',
    @Query('perPage') perPage = '10',
    @Query('q') q = '',
    @Query('role') role?: string,
    @Query('teamId') teamId?: string,
  ) {
    return this.teamService.listDirectory(currentUser, {
      page: Number.parseInt(String(page), 10) || 0,
      perPage: Number.parseInt(String(perPage), 10) || 10,
      q,
      role,
      teamId,
    });
  }

  @Post('teams')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Cria um novo time' })
  createTeam(@CurrentUser() currentUser: CurrentUserPayload, @Body() dto: CreateTeamDto, @Req() req: Request) {
    return this.teamService.createTeam(currentUser, dto, req);
  }

  @Get('teams/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiParam({ name: 'id' })
  @ApiOperation({ summary: 'Retorna detalhe de um time' })
  getTeam(@Param('id') id: string, @CurrentUser() currentUser: CurrentUserPayload) {
    return this.teamService.getTeam(id, currentUser.organizationId);
  }

  @Patch('teams/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, TeamMemberGuard)
  @TeamPolicy('team:update')
  @ApiOperation({ summary: 'Atualiza time' })
  updateTeam(
    @Param('id') id: string,
    @CurrentUser() currentUser: CurrentUserPayload,
    @Body() dto: UpdateTeamDto,
    @Req() req: Request,
  ) {
    return this.teamService.updateTeam(id, currentUser, dto, req);
  }

  @Delete('teams/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, TeamMemberGuard)
  @TeamPolicy('team:delete')
  @ApiOperation({ summary: 'Exclui time (soft delete)' })
  deleteTeam(@Param('id') id: string, @CurrentUser() currentUser: CurrentUserPayload, @Req() req: Request) {
    return this.teamService.deleteTeam(id, currentUser, req);
  }

  @Post('teams/:id/archive')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, TeamMemberGuard)
  @TeamPolicy('team:archive')
  @ApiOperation({ summary: 'Arquiva ou restaura time' })
  setArchive(
    @Param('id') id: string,
    @CurrentUser() currentUser: CurrentUserPayload,
    @Body() dto: ArchiveTeamDto,
    @Req() req: Request,
  ) {
    return this.teamService.setArchived(id, currentUser, dto.archive, req);
  }

  @Post('teams/:id/duplicate')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, TeamMemberGuard)
  @TeamPolicy('team:create')
  @ApiOperation({ summary: 'Duplica time' })
  duplicateTeam(@Param('id') id: string, @CurrentUser() currentUser: CurrentUserPayload, @Req() req: Request) {
    return this.teamService.duplicateTeam(id, currentUser, req);
  }

  @Get('teams/:id/members')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, TeamMemberGuard)
  @ApiOperation({ summary: 'Lista membros do time' })
  listMembers(@Param('id') id: string, @CurrentUser() currentUser: CurrentUserPayload) {
    return this.teamService.listMembers(id, currentUser);
  }

  @Post('teams/:id/members')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, TeamMemberGuard)
  @TeamPolicy('member:add')
  @ApiOperation({ summary: 'Adiciona membro ao time' })
  addMember(
    @Param('id') id: string,
    @CurrentUser() currentUser: CurrentUserPayload,
    @Body() dto: AddTeamMemberDto,
    @Req() req: Request,
  ) {
    return this.teamService.addMember(id, currentUser, dto, req);
  }

  @Patch('teams/:id/members/:memberId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, TeamMemberGuard)
  @TeamPolicy('member:updateRole')
  @ApiOperation({ summary: 'Atualiza role/status de membro' })
  updateMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @CurrentUser() currentUser: CurrentUserPayload,
    @Body() dto: UpdateMemberRoleDto,
    @Req() req: Request,
  ) {
    return this.teamService.updateMember(id, memberId, currentUser, dto, req);
  }

  @Delete('teams/:id/members/:memberId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, TeamMemberGuard)
  @TeamPolicy('member:remove')
  @ApiOperation({ summary: 'Remove membro do time' })
  removeMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @CurrentUser() currentUser: CurrentUserPayload,
    @Req() req: Request,
  ) {
    return this.teamService.removeMember(id, memberId, currentUser, req);
  }

  @Get('teams/:id/invites')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, TeamMemberGuard)
  @ApiOperation({ summary: 'Lista convites pendentes do time' })
  listInvites(@Param('id') id: string, @CurrentUser() currentUser: CurrentUserPayload) {
    return this.teamService.listInvites(id, currentUser);
  }

  @Post('teams/:id/invites')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, TeamMemberGuard)
  @TeamPolicy('team:invite')
  @ApiOperation({ summary: 'Cria convites de membros' })
  createInvites(
    @Param('id') id: string,
    @CurrentUser() currentUser: CurrentUserPayload,
    @Body() dto: InviteMemberDto,
    @Req() req: Request,
  ) {
    return this.teamService.createInvites(id, currentUser, dto, req);
  }

  @Post('invites/:id/resend')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Reenvia convite' })
  resendInvite(@Param('id') id: string, @CurrentUser() currentUser: CurrentUserPayload, @Req() req: Request) {
    return this.teamService.resendInvite(id, currentUser, req);
  }

  @Delete('invites/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Revoga convite' })
  revokeInvite(@Param('id') id: string, @CurrentUser() currentUser: CurrentUserPayload, @Req() req: Request) {
    return this.teamService.revokeInvite(id, currentUser, req);
  }

  @Post('invites/:token/accept')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Aceita convite por token' })
  acceptInvite(
    @Param('token') token: string,
    @CurrentUser() currentUser: CurrentUserPayload,
    @Req() req: Request,
  ) {
    return this.teamService.acceptInvite(token, currentUser, req);
  }
}
