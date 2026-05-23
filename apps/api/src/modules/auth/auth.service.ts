import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import type { Request, Response } from 'express';
import type { LoginDto } from './dto/login.dto';

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  avatarUrl?: string;
  role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER' | 'GUEST';
}

export interface AuthUserPayload {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRecord['role'];
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// ─── In-memory user store (replace with Prisma in production) ───────────────

const MOCK_USERS: UserRecord[] = [];

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  private readonly accessSecret = process.env.JWT_ACCESS_SECRET ?? 'change-me';
  private readonly refreshSecret = process.env.JWT_REFRESH_SECRET ?? 'change-me-refresh';
  private readonly accessExpiresIn = '15m';
  private readonly refreshExpiresIn = '7d';
  private readonly refreshCookieName = 'refresh_token';

  // ─── Token helpers ─────────────────────────────────────────────────────────

  private signAccess(payload: AuthUserPayload): string {
    return this.jwtService.sign(payload, {
      secret: this.accessSecret,
      expiresIn: this.accessExpiresIn,
    });
  }

  private signRefresh(payload: AuthUserPayload): string {
    return this.jwtService.sign({ sub: payload.id }, {
      secret: this.refreshSecret,
      expiresIn: this.refreshExpiresIn,
    });
  }

  private setRefreshCookie(res: Response, token: string): void {
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie(this.refreshCookieName, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });
  }

  private clearRefreshCookie(res: Response): void {
    res.clearCookie(this.refreshCookieName, { path: '/' });
  }

  private readRefreshCookie(req: Request): string | undefined {
    return req.cookies?.[this.refreshCookieName] as string | undefined;
  }

  // ─── Auth operations ───────────────────────────────────────────────────────

  async login(dto: LoginDto, res: Response) {
    const user = MOCK_USERS.find((u) => u.email === dto.email);

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatch) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const payload: AuthUserPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatarUrl,
      role: user.role,
    };

    const accessToken = this.signAccess(payload);
    const refreshToken = this.signRefresh(payload);

    this.setRefreshCookie(res, refreshToken);

    return { user: payload, accessToken };
  }

  async refresh(req: Request, res: Response) {
    const token = this.readRefreshCookie(req);
    if (!token) {
      throw new UnauthorizedException('Sessão expirada');
    }

    let decoded: { sub: string };
    try {
      decoded = this.jwtService.verify<{ sub: string }>(token, {
        secret: this.refreshSecret,
      });
    } catch {
      this.clearRefreshCookie(res);
      throw new UnauthorizedException('Sessão inválida');
    }

    const user = MOCK_USERS.find((u) => u.id === decoded.sub);
    if (!user) {
      this.clearRefreshCookie(res);
      throw new NotFoundException('Usuário não encontrado');
    }

    const payload: AuthUserPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatarUrl,
      role: user.role,
    };

    const newAccessToken = this.signAccess(payload);
    const newRefreshToken = this.signRefresh(payload);

    this.setRefreshCookie(res, newRefreshToken);

    return { accessToken: newAccessToken };
  }

  logout(_req: Request, res: Response) {
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

    const user = MOCK_USERS.find((u) => u.id === payload.id);
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatarUrl,
      role: user.role,
    };
  }

  // ─── OAuth redirect helpers ────────────────────────────────────────────────

  oauthRedirectGoogle() {
    const googleAuthUrl = process.env.GOOGLE_OAUTH_URL ?? '#';
    return { url: googleAuthUrl };
  }

  oauthRedirectGithub() {
    const githubAuthUrl = process.env.GITHUB_OAUTH_URL ?? '#';
    return { url: githubAuthUrl };
  }

  // ─── Utility: seed a user (for dev/testing) ───────────────────────────────

  async seedUser(email: string, plainPassword: string, name: string): Promise<UserRecord> {
    const existing = MOCK_USERS.find((u) => u.email === email);
    if (existing) return existing;

    const passwordHash = await bcrypt.hash(plainPassword, 12);
    const user: UserRecord = {
      id: `user_${Date.now()}`,
      email,
      name,
      passwordHash,
      role: 'OWNER',
    };
    MOCK_USERS.push(user);
    return user;
  }
}
