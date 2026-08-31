import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import type { CurrentUserPayload } from '../auth/types/current-user.type';
import { PrismaService } from '../prisma/prisma.service';
import { AdminResetPasswordDto } from './dto/admin-reset-password.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly prisma: PrismaService, private readonly usersService: UsersService) {}

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

  @Patch(':id/password')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Redefine senha local e revoga todas as sessoes do usuario' })
  resetPassword(
    @Param('id') userId: string,
    @Body() dto: AdminResetPasswordDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.usersService.adminResetPassword(userId, dto.newPassword, currentUser);
  }
}
