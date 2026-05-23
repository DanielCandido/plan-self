import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import type { LoginDto } from './dto/login.dto';
import { apiConfig } from '../../config/api.config';

export interface AuthUserPayload {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: Role;
}

interface RefreshPayload {
  sub: string;
  jti: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  private readonly accessSecret = apiConfig.jwtAccessSecret;
  private readonly refreshSecret = apiConfig.jwtRefreshSecret;
  private readonly accessExpiresIn = '15m';
  private readonly refreshExpiresIn = '7d';
  private readonly refreshCookieName = 'refresh_token';
  private readonly refreshWindowMs = 7 * 24 * 60 * 60 * 1000;

  private signAccess(payload: AuthUserPayload): string {
    return this.jwtService.sign(payload, {
      secret: this.accessSecret,
      expiresIn: this.accessExpiresIn,
    });
  }

  private signRefresh(payload: RefreshPayload): string {
    return this.jwtService.sign(payload, {
      secret: this.refreshSecret,
      expiresIn: this.refreshExpiresIn,
    });
  }

  private setRefreshCookie(res: Response, token: string): void {
    const isProduction = apiConfig.nodeEnv === 'production';
    res.cookie(this.refreshCookieName, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: this.refreshWindowMs,
      path: '/',
    });
  }

  private clearRefreshCookie(res: Response): void {
    const isProduction = apiConfig.nodeEnv === 'production';
    res.clearCookie(this.refreshCookieName, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      path: '/',
    });
  }

  private readRefreshCookie(req: Request): string | undefined {
    return req.cookies?.[this.refreshCookieName] as string | undefined;
  }

  private buildAuthPayload(user: { id: string; name: string; email: string; avatarUrl: string | null; role: Role }): AuthUserPayload {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatarUrl ?? undefined,
      role: user.role,
    };
  }

  private refreshExpiresAt(): Date {
    return new Date(Date.now() + this.refreshWindowMs);
  }

  private getRequestIp(req: Request): string | undefined {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
      return forwarded.split(',')[0]?.trim();
    }
    if (Array.isArray(forwarded) && forwarded.length > 0) {
      return forwarded[0];
    }
    return req.ip;
  }

  private getUserAgent(req: Request): string | undefined {
    const userAgent = req.headers['user-agent'];
    if (typeof userAgent === 'string') {
      return userAgent;
    }
    if (Array.isArray(userAgent)) {
      return userAgent[0];
    }
    return undefined;
  }

  private async revokeAllUserSessions(userId: string): Promise<void> {
    await this.prisma.authSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async createSession(params: {
    userId: string;
    jti: string;
    refreshToken: string;
    req: Request;
  }) {
    const refreshTokenHash = await bcrypt.hash(params.refreshToken, 12);
    return this.prisma.authSession.create({
      data: {
        userId: params.userId,
        jti: params.jti,
        refreshTokenHash,
        expiresAt: this.refreshExpiresAt(),
        userAgent: this.getUserAgent(params.req),
        ipAddress: this.getRequestIp(params.req),
      },
    });
  }

  async login(dto: LoginDto, req: Request, res: Response) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });

    if (!user || !user.passwordHash || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatch) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const payload = this.buildAuthPayload(user);
    const accessToken = this.signAccess(payload);

    const jti = randomUUID();
    const refreshToken = this.signRefresh({ sub: user.id, jti });

    await this.createSession({
      userId: user.id,
      jti,
      refreshToken,
      req,
    });

    this.setRefreshCookie(res, refreshToken);

    return { user: payload, accessToken };
  }

  async refresh(req: Request, res: Response) {
    const token = this.readRefreshCookie(req);
    if (!token) {
      throw new UnauthorizedException('Sessão expirada');
    }

    let decoded: RefreshPayload;
    try {
      decoded = this.jwtService.verify<RefreshPayload>(token, {
        secret: this.refreshSecret,
      });
    } catch {
      this.clearRefreshCookie(res);
      throw new UnauthorizedException('Sessão inválida');
    }

    const session = await this.prisma.authSession.findUnique({
      where: { jti: decoded.jti },
      include: { user: true },
    });

    if (!session || session.userId !== decoded.sub) {
      this.clearRefreshCookie(res);
      throw new UnauthorizedException('Sessão inválida');
    }

    if (session.revokedAt) {
      await this.revokeAllUserSessions(session.userId);
      this.clearRefreshCookie(res);
      throw new UnauthorizedException('Sessão inválida');
    }

    if (session.expiresAt.getTime() <= Date.now()) {
      await this.prisma.authSession.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      });
      this.clearRefreshCookie(res);
      throw new UnauthorizedException('Sessão expirada');
    }

    const refreshMatch = await bcrypt.compare(token, session.refreshTokenHash);
    if (!refreshMatch) {
      await this.revokeAllUserSessions(session.userId);
      this.clearRefreshCookie(res);
      throw new UnauthorizedException('Sessão inválida');
    }

    if (session.user.status !== 'ACTIVE') {
      await this.revokeAllUserSessions(session.userId);
      this.clearRefreshCookie(res);
      throw new UnauthorizedException('Conta indisponível');
    }

    const payload = this.buildAuthPayload(session.user);
    const newAccessToken = this.signAccess(payload);

    const newJti = randomUUID();
    const newRefreshToken = this.signRefresh({ sub: session.userId, jti: newJti });
    const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, 12);
    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      const nextSession = await tx.authSession.create({
        data: {
          userId: session.userId,
          jti: newJti,
          refreshTokenHash: newRefreshTokenHash,
          expiresAt: this.refreshExpiresAt(),
          userAgent: this.getUserAgent(req),
          ipAddress: this.getRequestIp(req),
          lastUsedAt: now,
        },
      });

      await tx.authSession.update({
        where: { id: session.id },
        data: {
          revokedAt: now,
          replacedBySessionId: nextSession.id,
          lastUsedAt: now,
        },
      });
    });

    this.setRefreshCookie(res, newRefreshToken);

    return { accessToken: newAccessToken };
  }

  async logout(req: Request, res: Response) {
    const token = this.readRefreshCookie(req);

    if (token) {
      try {
        const decoded = this.jwtService.verify<RefreshPayload>(token, {
          secret: this.refreshSecret,
        });

        await this.prisma.authSession.updateMany({
          where: {
            jti: decoded.jti,
            userId: decoded.sub,
            revokedAt: null,
          },
          data: {
            revokedAt: new Date(),
            lastUsedAt: new Date(),
          },
        });
      } catch {
        // Ignore invalid/expired refresh token during logout.
      }
    }

    this.clearRefreshCookie(res);
    return { ok: true };
  }

  async me(req: Request) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Não autenticado');
    }

    const token = authHeader.split(' ')[1];
    let payload: AuthUserPayload;
    try {
      payload = this.jwtService.verify<AuthUserPayload>(token, {
        secret: this.accessSecret,
      });
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado');
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.id } });
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatarUrl ?? undefined,
      role: user.role,
    };
  }

  oauthRedirectGoogle() {
    return { url: apiConfig.googleOauthUrl };
  }

  oauthRedirectGithub() {
    return { url: apiConfig.githubOauthUrl };
  }
}
