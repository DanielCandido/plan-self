import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { MemberStatus, Prisma, Role, TeamVisibility } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const ORDERABLE_FIELDS = ['name', 'createdAt', 'updatedAt'] as const;
type OrderField = (typeof ORDERABLE_FIELDS)[number];

@Injectable()
export class TeamRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listTeams(
    organizationId: string,
    options: {
      page: number;
      perPage: number;
      q?: string;
      archived: boolean;
      sortBy: OrderField;
      order: Prisma.SortOrder;
    },
  ) {
    const where: Prisma.TeamWhereInput = {
      organizationId,
      archivedAt: options.archived ? { not: null } : null,
    };

    if (options.q?.trim()) {
      where.OR = [
        { name: { contains: options.q.trim(), mode: 'insensitive' } },
        { description: { contains: options.q.trim(), mode: 'insensitive' } },
      ];
    }

    const [teams, totalCount] = await Promise.all([
      this.prisma.team.findMany({
        where,
        include: {
          _count: {
            select: { memberships: true, projects: true },
          },
          activities: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { createdAt: true },
          },
        },
        skip: options.page * options.perPage,
        take: options.perPage,
        orderBy: { [options.sortBy]: options.order },
      }),
      this.prisma.team.count({ where }),
    ]);

    return {
      items: teams.map((team) => ({
        id: team.id,
        organizationId: team.organizationId,
        name: team.name,
        slug: team.slug,
        description: team.description,
        avatarUrl: team.avatarUrl,
        color: team.color,
        visibility: team.visibility,
        ownerId: team.ownerId,
        createdAt: team.createdAt.toISOString(),
        updatedAt: team.updatedAt.toISOString(),
        archivedAt: team.archivedAt?.toISOString() ?? null,
        memberCount: team._count.memberships,
        activeProjects: team._count.projects,
        recentActivityAt: team.activities[0]?.createdAt?.toISOString() ?? null,
      })),
      totalCount,
    };
  }

  async getTeamById(teamId: string, organizationId: string) {
    const team = await this.prisma.team.findFirst({
      where: { id: teamId, organizationId },
      include: {
        _count: {
          select: { memberships: true, projects: true },
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { createdAt: true },
        },
      },
    });

    if (!team) {
      throw new NotFoundException('Time não encontrado');
    }

    return {
      id: team.id,
      organizationId: team.organizationId,
      name: team.name,
      slug: team.slug,
      description: team.description,
      avatarUrl: team.avatarUrl,
      color: team.color,
      visibility: team.visibility,
      ownerId: team.ownerId,
      createdAt: team.createdAt.toISOString(),
      updatedAt: team.updatedAt.toISOString(),
      archivedAt: team.archivedAt?.toISOString() ?? null,
      memberCount: team._count.memberships,
      activeProjects: team._count.projects,
      recentActivityAt: team.activities[0]?.createdAt?.toISOString() ?? null,
    };
  }

  async createTeam(
    organizationId: string,
    payload: {
      name: string;
      slug: string;
      description?: string;
      avatarUrl?: string;
      color?: string;
      visibility?: TeamVisibility;
      ownerId: string;
      memberIds: string[];
    },
  ) {
    const team = await this.prisma.team.create({
      data: {
        organizationId,
        name: payload.name,
        slug: payload.slug,
        description: payload.description,
        avatarUrl: payload.avatarUrl,
        color: payload.color,
        visibility: payload.visibility ?? 'PRIVATE',
        ownerId: payload.ownerId,
        memberships: {
          createMany: {
            data: Array.from(new Set([payload.ownerId, ...payload.memberIds])).map((userId) => ({
              userId,
              role: userId === payload.ownerId ? Role.OWNER : Role.MEMBER,
              status: MemberStatus.OFFLINE,
            })),
            skipDuplicates: true,
          },
        },
      },
    });

    return this.getTeamById(team.id, organizationId);
  }

  async updateTeam(
    teamId: string,
    organizationId: string,
    payload: {
      name?: string;
      slug?: string;
      description?: string;
      avatarUrl?: string;
      color?: string;
      visibility?: TeamVisibility;
      ownerId?: string;
    },
  ) {
    const existing = await this.prisma.team.findFirst({
      where: { id: teamId, organizationId },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('Time não encontrado');
    }

    await this.prisma.team.update({
      where: { id: teamId },
      data: payload,
    });

    return this.getTeamById(teamId, organizationId);
  }

  async duplicateTeam(teamId: string, organizationId: string, ownerId: string, slug: string) {
    const existing = await this.prisma.team.findFirst({
      where: { id: teamId, organizationId },
      include: {
        memberships: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Time não encontrado');
    }

    const duplicated = await this.prisma.team.create({
      data: {
        organizationId,
        name: `${existing.name} Copy`,
        slug,
        description: existing.description,
        avatarUrl: existing.avatarUrl,
        color: existing.color,
        visibility: existing.visibility,
        ownerId,
        memberships: {
          createMany: {
            data: existing.memberships.map((membership) => ({
              userId: membership.userId,
              role: membership.role,
              status: membership.status,
              workload: membership.workload,
            })),
            skipDuplicates: true,
          },
        },
      },
    });

    return this.getTeamById(duplicated.id, organizationId);
  }

  async setArchived(teamId: string, organizationId: string, archive: boolean) {
    const team = await this.prisma.team.findFirst({
      where: { id: teamId, organizationId },
      select: { id: true },
    });

    if (!team) {
      throw new NotFoundException('Time não encontrado');
    }

    await this.prisma.team.update({
      where: { id: teamId },
      data: { archivedAt: archive ? new Date() : null },
    });
  }

  async countActiveTeams(organizationId: string) {
    return this.prisma.team.count({
      where: {
        organizationId,
        archivedAt: null,
      },
    });
  }

  async removeTeam(teamId: string, organizationId: string) {
    await this.ensureTeam(teamId, organizationId);
    await this.prisma.team.update({
      where: { id: teamId },
      data: { archivedAt: new Date() },
    });

    return this.getTeamById(teamId, organizationId);
  }

  async listMembers(teamId: string, organizationId: string) {
    await this.ensureTeam(teamId, organizationId);

    const members = await this.prisma.teamMember.findMany({
      where: { teamId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        user: { name: 'asc' },
      },
    });

    return members.map((member) => ({
      id: member.id,
      teamId: member.teamId,
      userId: member.userId,
      name: member.user.name,
      email: member.user.email,
      avatarUrl: member.user.avatarUrl,
      role: member.role,
      status: member.status,
      workload: member.workload,
      projects: 0,
      lastActivityAt: null,
      suspendedAt: member.suspendedAt?.toISOString() ?? null,
    }));
  }

  async addMember(
    teamId: string,
    organizationId: string,
    payload: { userId: string; role: Role },
  ) {
    await this.ensureTeam(teamId, organizationId);
    await this.ensureOrgUser(payload.userId, organizationId);

    await this.prisma.teamMember.upsert({
      where: { teamId_userId: { teamId, userId: payload.userId } },
      update: { role: payload.role, suspendedAt: null },
      create: {
        teamId,
        userId: payload.userId,
        role: payload.role,
      },
    });

    return this.listMembers(teamId, organizationId);
  }

  async updateMember(
    teamId: string,
    memberId: string,
    organizationId: string,
    payload: {
      role?: Role;
      status?: MemberStatus;
      workload?: number;
      suspended?: boolean;
    },
  ) {
    await this.ensureTeam(teamId, organizationId);
    const member = await this.prisma.teamMember.findFirst({
      where: { id: memberId, teamId },
      select: { id: true },
    });
    if (!member) {
      throw new NotFoundException('Membro não encontrado');
    }

    await this.prisma.teamMember.update({
      where: { id: memberId },
      data: {
        role: payload.role,
        status: payload.status,
        workload: payload.workload,
        suspendedAt: payload.suspended === undefined ? undefined : payload.suspended ? new Date() : null,
      },
    });

    return this.listMembers(teamId, organizationId);
  }

  async removeMember(teamId: string, memberId: string, organizationId: string) {
    await this.ensureTeam(teamId, organizationId);

    const member = await this.prisma.teamMember.findFirst({
      where: { id: memberId, teamId },
      select: { id: true },
    });
    if (!member) {
      throw new NotFoundException('Membro não encontrado');
    }

    await this.prisma.teamMember.delete({ where: { id: memberId } });
    return this.listMembers(teamId, organizationId);
  }

  async listInvites(teamId: string, organizationId: string) {
    await this.ensureTeam(teamId, organizationId);

    const invites = await this.prisma.teamInvite.findMany({
      where: {
        teamId,
        organizationId,
        acceptedAt: null,
        revokedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    return invites.map((invite) => ({
      id: invite.id,
      email: invite.email,
      token: invite.token,
      organizationId: invite.organizationId,
      teamId: invite.teamId,
      invitedById: invite.invitedById,
      role: invite.role,
      expiresAt: invite.expiresAt.toISOString(),
      acceptedAt: invite.acceptedAt?.toISOString() ?? null,
      revokedAt: invite.revokedAt?.toISOString() ?? null,
      createdAt: invite.createdAt.toISOString(),
    }));
  }

  async createInvite(payload: {
    email: string;
    token: string;
    organizationId: string;
    teamId: string;
    invitedById: string;
    role: Role;
    expiresAt: Date;
  }) {
    const existingInvite = await this.prisma.teamInvite.findFirst({
      where: {
        organizationId: payload.organizationId,
        teamId: payload.teamId,
        email: payload.email,
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: { id: true },
    });

    if (existingInvite) {
      throw new BadRequestException(`Já existe convite pendente para ${payload.email}`);
    }

    return this.prisma.teamInvite.create({
      data: payload,
    });
  }

  async revokeInvite(inviteId: string, organizationId: string) {
    const invite = await this.prisma.teamInvite.findFirst({
      where: { id: inviteId, organizationId },
      select: { id: true },
    });
    if (!invite) {
      throw new NotFoundException('Convite não encontrado');
    }

    await this.prisma.teamInvite.update({
      where: { id: inviteId },
      data: { revokedAt: new Date() },
    });
  }

  async getInviteByToken(token: string) {
    const invite = await this.prisma.teamInvite.findUnique({
      where: { token },
    });

    if (!invite) {
      throw new NotFoundException('Convite não encontrado');
    }

    return invite;
  }

  async getInviteById(inviteId: string) {
    const invite = await this.prisma.teamInvite.findUnique({
      where: { id: inviteId },
    });
    if (!invite) {
      throw new NotFoundException('Convite não encontrado');
    }
    return invite;
  }

  async acceptInvite(inviteId: string, userId: string) {
    const invite = await this.prisma.teamInvite.findUnique({
      where: { id: inviteId },
      select: { id: true, teamId: true, role: true, acceptedAt: true, revokedAt: true, expiresAt: true },
    });
    if (!invite) {
      throw new NotFoundException('Convite não encontrado');
    }
    if (invite.revokedAt || invite.acceptedAt || invite.expiresAt < new Date()) {
      throw new BadRequestException('Convite inválido ou expirado');
    }

    await this.prisma.$transaction([
      this.prisma.teamMember.upsert({
        where: {
          teamId_userId: {
            teamId: invite.teamId,
            userId,
          },
        },
        update: {
          role: invite.role,
          suspendedAt: null,
        },
        create: {
          teamId: invite.teamId,
          userId,
          role: invite.role,
        },
      }),
      this.prisma.teamInvite.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      }),
    ]);

    return invite;
  }

  async listDirectory(
    organizationId: string,
    options: { page: number; perPage: number; q?: string; role?: string; teamId?: string },
  ) {
    const where: Prisma.TeamMemberWhereInput = {
      team: { organizationId, archivedAt: null },
      ...(options.teamId ? { teamId: options.teamId } : {}),
      ...(options.role ? { role: options.role as Role } : {}),
      ...(options.q?.trim()
        ? {
            OR: [
              {
                user: {
                  name: { contains: options.q.trim(), mode: 'insensitive' },
                },
              },
              {
                user: {
                  email: { contains: options.q.trim(), mode: 'insensitive' },
                },
              },
            ],
          }
        : {}),
    };

    const [items, totalCount] = await Promise.all([
      this.prisma.teamMember.findMany({
        where,
        include: {
          user: {
            select: { name: true, email: true, avatarUrl: true },
          },
          team: {
            select: { id: true, name: true },
          },
        },
        skip: options.page * options.perPage,
        take: options.perPage,
        orderBy: [{ user: { name: 'asc' } }],
      }),
      this.prisma.teamMember.count({ where }),
    ]);

    return {
      items: items.map((item) => ({
        id: item.id,
        teamId: item.teamId,
        userId: item.userId,
        name: item.user.name,
        email: item.user.email,
        avatarUrl: item.user.avatarUrl,
        role: item.role,
        status: item.status,
        workload: item.workload,
        projects: 0,
        team: item.team.name,
        lastActivityAt: null,
        suspendedAt: item.suspendedAt?.toISOString() ?? null,
      })),
      totalCount,
    };
  }

  async createActivity(payload: {
    teamId: string;
    actorId?: string;
    action: string;
    metadata?: Prisma.InputJsonValue;
  }) {
    return this.prisma.teamActivity.create({
      data: {
        teamId: payload.teamId,
        actorId: payload.actorId,
        action: payload.action,
        metadata: payload.metadata,
      },
    });
  }

  async createAuditLog(payload: {
    organizationId: string;
    actorId?: string;
    action: string;
    entity?: string;
    entityId?: string;
    metadata?: Prisma.InputJsonValue;
    ipAddress?: string;
  }) {
    return this.prisma.auditLog.create({
      data: {
        ...payload,
        metadata: payload.metadata,
      },
    });
  }

  async ensureUniqueSlug(organizationId: string, base: string, excludedTeamId?: string) {
    let suffix = 0;
    let slug = base;
    while (true) {
      const existing = await this.prisma.team.findFirst({
        where: {
          organizationId,
          slug,
          ...(excludedTeamId ? { id: { not: excludedTeamId } } : {}),
        },
        select: { id: true },
      });

      if (!existing) {
        return slug;
      }
      suffix += 1;
      slug = `${base}-${suffix}`;
    }
  }

  private async ensureTeam(teamId: string, organizationId: string) {
    const team = await this.prisma.team.findFirst({
      where: { id: teamId, organizationId },
      select: { id: true },
    });
    if (!team) {
      throw new NotFoundException('Time não encontrado');
    }
  }

  private async ensureOrgUser(userId: string, organizationId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, organizationId },
      select: { id: true },
    });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
  }
}
