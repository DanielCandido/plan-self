import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { ProjectsController } from './projects.controller';
import { ProjectsRepository } from './projects.repository';
import { ProjectsService } from './projects.service';
import { ProjectFilesService } from './project-files.service';
import { ConstructionPlanningService } from './construction-planning.service';
import { SiteDiaryService } from './site-diary.service';
import { ConstructionQualityService } from './construction-quality.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ProjectsController],
  providers: [ProjectsService, ProjectsRepository, ProjectFilesService, ConstructionPlanningService, SiteDiaryService, ConstructionQualityService, JwtAuthGuard],
  exports: [ProjectsService],
})
export class ProjectsModule {}
