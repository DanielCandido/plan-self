import { CanActivate, ExecutionContext, ForbiddenException, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { CurrentUserPayload } from '../../auth/types/current-user.type';
import { PrismaService } from '../../prisma/prisma.service';
import { canPerform, type TeamPolicyAction } from '../policies/team.policy';

export const TEAM_POLICY_KEY = 'team_policy_action';
export const TeamPolicy = (action: TeamPolicyAction) => SetMetadata(TEAM_POLICY_KEY, action);

type RequestWithUser = Request & { user?: CurrentUserPayload };

@Injectable()
export class TeamMemberGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    const action = this.reflector.getAllAndOverride<TeamPolicyAction>(TEAM_POLICY_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!action) {
      return true;
    }

    if (!canPerform(action, user.role)) {
      throw new ForbiddenException('Permissão insuficiente');
    }

    const teamId = String(request.params.id ?? request.body.teamId ?? '').trim();
    if (!teamId) {
      return true;
    }

    const membership = await this.prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: user.id,
      },
      select: { id: true, suspendedAt: true },
    });

    if (!membership && user.role !== 'OWNER' && user.role !== 'ADMIN') {
      throw new ForbiddenException('Usuário não pertence ao time');
    }

    if (membership?.suspendedAt) {
      throw new ForbiddenException('Usuário suspenso no time');
    }

    return true;
  }
}
