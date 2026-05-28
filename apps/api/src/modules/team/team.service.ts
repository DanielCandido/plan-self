import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MemberStatus, Prisma, Role } from '@prisma/client';
import type { Request } from 'express';
import type { CurrentUserPayload } from '../auth/types/current-user.type';
import { TeamEventsPublisher } from './events/team-events.publisher';
import { TeamRepository } from './team.repository';

@Injectable()
export class TeamService {
  constructor(
    private readonly repository: TeamRepository,
    private readonly jwtService: JwtService,
    private readonly events: TeamEventsPublisher,
  ) {}

  async listTeams(
    organizationId: string,
    query: { page: number; perPage: number; q?: string; archived: boolean; sortBy: 'name' | 'createdAt' | 'updatedAt'; order: 'asc' | 'desc' },
  ) {
    return this.repository.listTeams(organizationId, query);
  }

  async getTeam(teamId: string, organizationId: string) {
    return this.repository.getTeamById(teamId, organizationId);
  }

  async createTeam(
    currentUser: CurrentUserPayload,
    payload: {
      name: string;
      description?: string;
      avatarUrl?: string;
      color?: string;
      visibility?: 'PUBLIC' | 'PRIVATE' | 'SECRET';
      ownerId?: string;
      memberIds?: string[];
    },
    request?: Request,
  ) {
    const ownerId = payload.ownerId ?? currentUser.id;
    const slug = await this.buildUniqueSlug(currentUser.organizationId, payload.name);
    const team = await this.repository.createTeam(currentUser.organizationId, {
      ...payload,
      slug,
      ownerId,
      memberIds: payload.memberIds ?? [],
    });

    await this.logAction({
      organizationId: currentUser.organizationId,
      actorId: currentUser.id,
      teamId: team.id,
      action: 'team.created',
      entity: 'team',
      metadata: { name: team.name, slug: team.slug },
      request,
    });

    await this.events.publish('team_updated', { teamId: team.id, data: { teamId: team.id, action: 'created' } });
    return team;
  }

  async updateTeam(
    teamId: string,
    currentUser: CurrentUserPayload,
    payload: {
      name?: string;
      slug?: string;
      description?: string;
      avatarUrl?: string;
      color?: string;
      visibility?: 'PUBLIC' | 'PRIVATE' | 'SECRET';
      ownerId?: string;
    },
    request?: Request,
  ) {
    const data = { ...payload };
    if (data.slug) {
      data.slug = await this.repository.ensureUniqueSlug(currentUser.organizationId, data.slug, teamId);
    } else if (data.name) {
      data.slug = await this.buildUniqueSlug(currentUser.organizationId, data.name, teamId);
    }

    const team = await this.repository.updateTeam(teamId, currentUser.organizationId, data);
    await this.logAction({
      organizationId: currentUser.organizationId,
      actorId: currentUser.id,
      teamId,
      action: 'team.updated',
      entity: 'team',
      metadata: data,
      request,
    });

    await this.events.publish('team_updated', { teamId, data: { teamId } });
    return team;
  }

  async duplicateTeam(teamId: string, currentUser: CurrentUserPayload, request?: Request) {
    const source = await this.repository.getTeamById(teamId, currentUser.organizationId);
    const slug = await this.buildUniqueSlug(currentUser.organizationId, `${source.name}-copy`);
    const duplicated = await this.repository.duplicateTeam(teamId, currentUser.organizationId, currentUser.id, slug);

    await this.logAction({
      organizationId: currentUser.organizationId,
      actorId: currentUser.id,
      teamId: duplicated.id,
      action: 'team.duplicated',
      entity: 'team',
      metadata: { sourceTeamId: teamId, duplicatedTeamId: duplicated.id },
      request,
    });
    return duplicated;
  }

  async setArchived(teamId: string, currentUser: CurrentUserPayload, archive: boolean, request?: Request) {
    if (archive && !['OWNER', 'ADMIN', 'MANAGER'].includes(currentUser.role)) {
      throw new ForbiddenException('Sem permissão para arquivar');
    }

    await this.repository.setArchived(teamId, currentUser.organizationId, archive);

    await this.logAction({
      organizationId: currentUser.organizationId,
      actorId: currentUser.id,
      teamId,
      action: archive ? 'team.archived' : 'team.restored',
      entity: 'team',
      metadata: { archive },
      request,
    });

    await this.events.publish('team_archived', { teamId, data: { teamId, archive } });
    return { success: true };
  }

  async deleteTeam(teamId: string, currentUser: CurrentUserPayload, request?: Request) {
    if (!['OWNER', 'ADMIN'].includes(currentUser.role)) {
      throw new ForbiddenException('Apenas Owner/Admin podem excluir');
    }

    const totalActive = await this.repository.countActiveTeams(currentUser.organizationId);
    if (totalActive <= 1) {
      throw new BadRequestException('Não é permitido excluir o último time da organização');
    }

    const team = await this.repository.removeTeam(teamId, currentUser.organizationId);
    await this.logAction({
      organizationId: currentUser.organizationId,
      actorId: currentUser.id,
      teamId,
      action: 'team.deleted',
      entity: 'team',
      metadata: { teamId },
      request,
    });
    return team;
  }

  async listMembers(teamId: string, currentUser: CurrentUserPayload) {
    return this.repository.listMembers(teamId, currentUser.organizationId);
  }

  async addMember(
    teamId: string,
    currentUser: CurrentUserPayload,
    payload: { userId: string; role?: Role },
    request?: Request,
  ) {
    const members = await this.repository.addMember(teamId, currentUser.organizationId, {
      userId: payload.userId,
      role: payload.role ?? Role.MEMBER,
    });

    await this.logAction({
      organizationId: currentUser.organizationId,
      actorId: currentUser.id,
      teamId,
      action: 'member.added',
      entity: 'team_member',
      metadata: { userId: payload.userId, role: payload.role ?? Role.MEMBER },
      request,
    });
    await this.events.publish('member_joined', { teamId, data: { teamId, userId: payload.userId } });
    return members;
  }

  async updateMember(
    teamId: string,
    memberId: string,
    currentUser: CurrentUserPayload,
    payload: { role?: Role; status?: MemberStatus; workload?: number; suspended?: boolean },
    request?: Request,
  ) {
    const members = await this.repository.updateMember(teamId, memberId, currentUser.organizationId, payload);

    await this.logAction({
      organizationId: currentUser.organizationId,
      actorId: currentUser.id,
      teamId,
      action: 'member.updated',
      entity: 'team_member',
      entityId: memberId,
      metadata: payload,
      request,
    });

    if (payload.status) {
      await this.events.publish('status_changed', { teamId, data: { teamId, memberId, status: payload.status } });
    } else {
      await this.events.publish('team_updated', { teamId, data: { teamId, memberId } });
    }

    return members;
  }

  async removeMember(teamId: string, memberId: string, currentUser: CurrentUserPayload, request?: Request) {
    const members = await this.repository.removeMember(teamId, memberId, currentUser.organizationId);

    await this.logAction({
      organizationId: currentUser.organizationId,
      actorId: currentUser.id,
      teamId,
      action: 'member.removed',
      entity: 'team_member',
      entityId: memberId,
      metadata: { memberId },
      request,
    });

    await this.events.publish('member_removed', { teamId, data: { teamId, memberId } });
    return members;
  }

  async listInvites(teamId: string, currentUser: CurrentUserPayload) {
    return this.repository.listInvites(teamId, currentUser.organizationId);
  }

  async createInvites(
    teamId: string,
    currentUser: CurrentUserPayload,
    payload: { emails: string[]; role?: Role; expiresInDays?: number },
    request?: Request,
  ) {
    const role = payload.role ?? Role.MEMBER;
    const expiresInDays = payload.expiresInDays ?? 7;
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
    const uniqueEmails = Array.from(new Set(payload.emails.map((email) => email.toLowerCase().trim())));

    for (const email of uniqueEmails) {
      const tokenPayload = {
        email,
        teamId,
        organizationId: currentUser.organizationId,
        invitedBy: currentUser.id,
        role,
      };
      const token = this.jwtService.sign(tokenPayload, {
        expiresIn: `${expiresInDays}d`,
      });

      await this.repository.createInvite({
        email,
        token,
        organizationId: currentUser.organizationId,
        teamId,
        invitedById: currentUser.id,
        role,
        expiresAt,
      });

      await this.logAction({
        organizationId: currentUser.organizationId,
        actorId: currentUser.id,
        teamId,
        action: 'invite.sent',
        entity: 'team_invite',
        metadata: { email, role, expiresAt: expiresAt.toISOString() },
        request,
      });

      await this.events.publish('invite_sent', { teamId, data: { teamId, email, role } });
    }

    return this.repository.listInvites(teamId, currentUser.organizationId);
  }

  async resendInvite(inviteId: string, currentUser: CurrentUserPayload, request?: Request) {
    const invite = await this.repository.getInviteById(inviteId);
    if (invite.organizationId !== currentUser.organizationId) {
      throw new ForbiddenException('Convite não pertence à organização');
    }

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const token = this.jwtService.sign(
      {
        email: invite.email,
        teamId: invite.teamId,
        organizationId: invite.organizationId,
        invitedBy: currentUser.id,
        role: invite.role,
      },
      { expiresIn: '7d' },
    );

    await this.repository.revokeInvite(invite.id, invite.organizationId);
    await this.repository.createInvite({
      email: invite.email,
      token,
      organizationId: invite.organizationId,
      teamId: invite.teamId,
      invitedById: currentUser.id,
      role: invite.role,
      expiresAt,
    });

    await this.logAction({
      organizationId: currentUser.organizationId,
      actorId: currentUser.id,
      teamId: invite.teamId,
      action: 'invite.resent',
      entity: 'team_invite',
      entityId: invite.id,
      metadata: { email: invite.email },
      request,
    });

    return { success: true };
  }

  async revokeInvite(inviteId: string, currentUser: CurrentUserPayload, request?: Request) {
    await this.repository.revokeInvite(inviteId, currentUser.organizationId);
    await this.logAction({
      organizationId: currentUser.organizationId,
      actorId: currentUser.id,
      action: 'invite.revoked',
      entity: 'team_invite',
      entityId: inviteId,
      metadata: { inviteId },
      request,
    });
    return { success: true };
  }

  async acceptInvite(token: string, currentUser: CurrentUserPayload, request?: Request) {
    const invite = await this.repository.getInviteByToken(token);
    this.jwtService.verify(token);

    if (invite.expiresAt < new Date()) {
      throw new BadRequestException('Convite expirado');
    }

    await this.repository.acceptInvite(invite.id, currentUser.id);
    await this.logAction({
      organizationId: invite.organizationId,
      actorId: currentUser.id,
      teamId: invite.teamId,
      action: 'invite.accepted',
      entity: 'team_invite',
      entityId: invite.id,
      metadata: { inviteId: invite.id },
      request,
    });

    await this.events.publish('member_joined', {
      teamId: invite.teamId,
      data: { teamId: invite.teamId, userId: currentUser.id, source: 'invite' },
    });

    return { success: true, teamId: invite.teamId };
  }

  async listDirectory(
    currentUser: CurrentUserPayload,
    query: { page: number; perPage: number; q?: string; role?: string; teamId?: string },
  ) {
    return this.repository.listDirectory(currentUser.organizationId, query);
  }

  private async buildUniqueSlug(organizationId: string, name: string, excludedTeamId?: string) {
    const base = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 50);

    if (!base) {
      throw new BadRequestException('Não foi possível gerar slug para o time');
    }

    return this.repository.ensureUniqueSlug(organizationId, base, excludedTeamId);
  }

  private async logAction(payload: {
    organizationId: string;
    actorId?: string;
    teamId?: string;
    action: string;
    entity?: string;
    entityId?: string;
    metadata?: Prisma.InputJsonValue;
    request?: Request;
  }) {
    if (payload.teamId) {
      await this.repository.createActivity({
        teamId: payload.teamId,
        actorId: payload.actorId,
        action: payload.action,
        metadata: payload.metadata,
      });
    }

    await this.repository.createAuditLog({
      organizationId: payload.organizationId,
      actorId: payload.actorId,
      action: payload.action,
      entity: payload.entity,
      entityId: payload.entityId ?? payload.teamId,
      metadata: payload.metadata,
      ipAddress:
        payload.request?.headers['x-forwarded-for']?.toString() ??
        payload.request?.socket.remoteAddress ??
        undefined,
    });
  }
}
