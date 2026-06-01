import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SprintModule } from '../sprints/sprint.module';
import { KanbanEventsPublisher } from './events/kanban-events.publisher';
import { BoardController } from './board.controller';
import { BoardService } from './board.service';

@Module({
  imports: [PrismaModule, AuthModule, SprintModule],
  controllers: [BoardController],
  providers: [BoardService, KanbanEventsPublisher],
  exports: [BoardService],
})
export class BoardModule {}
