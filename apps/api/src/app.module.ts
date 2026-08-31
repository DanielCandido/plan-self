import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './modules/auth/auth.module';
import { BoardModule } from './modules/board/board.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { KanbanModule } from './modules/kanban/kanban.module';
import { MessagingModule } from './modules/messaging/messaging.module';
import { SprintModule } from './modules/sprints/sprint.module';
import { TaskModule } from './modules/task/task.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { TeamModule } from './modules/team/team.module';
import { UsersModule } from './modules/users/users.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { IdempotencyInterceptor } from './common/interceptors/idempotency.interceptor';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 120,
      },
    ]),
    AuthModule,
    BoardModule,
    DashboardModule,
    KanbanModule,
    MessagingModule,
    SprintModule,
    TaskModule,
    ProjectsModule,
    TeamModule,
    UsersModule,
    PrismaModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: IdempotencyInterceptor },
  ],
})
export class AppModule {}
