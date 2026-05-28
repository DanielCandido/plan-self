import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { TeamEventsPublisher } from './events/team-events.publisher';
import { TeamMemberGuard } from './guards/team-member.guard';
import { TeamController } from './team.controller';
import { TeamRepository } from './team.repository';
import { TeamService } from './team.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [TeamController],
  providers: [TeamService, TeamRepository, TeamEventsPublisher, JwtAuthGuard, RolesGuard, TeamMemberGuard],
  exports: [TeamService],
})
export class TeamModule {}
