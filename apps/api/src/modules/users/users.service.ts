import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import type { CurrentUserPayload } from '../auth/types/current-user.type';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async adminResetPassword(targetUserId: string, newPassword: string, actor: CurrentUserPayload) {
    const target = await this.prisma.user.findFirst({
      where: { id: targetUserId, organizationId: actor.organizationId },
      select: { id: true, email: true, role: true },
    });
    if (!target) throw new NotFoundException('Usuario nao encontrado');

    if (actor.role === 'ADMIN' && ['OWNER', 'ADMIN'].includes(target.role) && target.id !== actor.id) {
      throw new ForbiddenException('Administradores nao podem redefinir a senha de outro administrador ou proprietario');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: target.id }, data: { passwordHash } }),
      this.prisma.authSession.updateMany({
        where: { userId: target.id, revokedAt: null },
        data: { revokedAt: now },
      }),
      this.prisma.auditLog.create({
        data: {
          organizationId: actor.organizationId,
          actorId: actor.id,
          action: 'user.password.admin_reset',
          entity: 'User',
          entityId: target.id,
          metadata: { targetEmail: target.email, sessionsRevokedAt: now.toISOString() },
        },
      }),
    ]);

    return { ok: true, sessionsRevoked: true, selfReset: target.id === actor.id };
  }
}
