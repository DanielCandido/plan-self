import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { CurrentUserPayload } from '../auth/types/current-user.type';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Lista usuários ativos da organização autenticada' })
  listUsers(@CurrentUser() currentUser: CurrentUserPayload) {
    return this.prisma.user.findMany({
      where: {
        organizationId: currentUser.organizationId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        status: true,
      },
      orderBy: [{ name: 'asc' }],
    });
  }

  @Get('me')
  @ApiOperation({ summary: 'Alias para usuário autenticado' })
  me(@CurrentUser() currentUser: CurrentUserPayload) {
    return currentUser;
  }
}
