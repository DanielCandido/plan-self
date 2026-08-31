import { Controller, Get, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('live')
  @ApiOperation({ summary: 'Confirma que o processo da API esta ativo' })
  live() {
    return this.healthService.live();
  }

  @Get('ready')
  @ApiOperation({ summary: 'Verifica banco, Redis e armazenamento local' })
  async ready(@Res({ passthrough: true }) response: Response) {
    const result = await this.healthService.ready();
    if (result.status === 'down') response.status(503);
    return result;
  }
}
