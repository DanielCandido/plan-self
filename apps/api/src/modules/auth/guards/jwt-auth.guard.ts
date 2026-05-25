import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { AuthUserPayload } from '../auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { apiConfig } from '../../../config/api.config';
import type { CurrentUserPayload } from '../types/current-user.type';

type RequestWithUser = Request & { user?: CurrentUserPayload };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Não autenticado');
    }

    const token = authHeader.slice(7);

    let payload: AuthUserPayload;
    try {
      payload = this.jwtService.verify<AuthUserPayload>(token, {
        secret: apiConfig.jwtAccessSecret,
      });
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        organizationId: true,
        status: true,
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    request.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    };

    return true;
  }
}
