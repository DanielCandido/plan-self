import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { DashboardGateway } from './dashboard.gateway';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [DashboardController],
  providers: [DashboardService, DashboardGateway, JwtAuthGuard],
})
export class DashboardModule {}
