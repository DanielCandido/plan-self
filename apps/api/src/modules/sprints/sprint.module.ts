import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { SprintController } from './sprint.controller';
import { SprintGateway } from './sprint.gateway';
import { SprintRepository } from './sprint.repository';
import { SprintScheduler } from './sprint.scheduler';
import { SprintService } from './sprint.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [SprintController],
  providers: [SprintService, SprintRepository, SprintGateway, SprintScheduler, JwtAuthGuard],
  exports: [SprintService, SprintGateway],
})
export class SprintModule {}
