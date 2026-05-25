import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SprintService } from './sprint.service';

@Injectable()
export class SprintScheduler {
  private readonly logger = new Logger(SprintScheduler.name);

  constructor(private readonly sprintService: SprintService) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async captureDailySnapshots() {
    const count = await this.sprintService.captureActiveSprintSnapshots();
    this.logger.debug(`Sprint daily snapshot job processed ${count} sprint(s)`);
  }
}
