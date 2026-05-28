import { Body, Controller, ForbiddenException, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { GatewayServer } from './socket.gateway';

@Controller('internal')
export class InternalEventsController {
  constructor(private readonly gateway: GatewayServer) {}

  @Post('team-events')
  emitTeamEvent(
    @Body() payload: { event: string; teamId: string; data?: Record<string, unknown> },
    @Req() request: Request,
  ) {
    const providedSecret = request.header('x-gateway-secret');
    const expectedSecret = process.env.GATEWAY_SECRET ?? process.env.JWT_ACCESS_SECRET ?? '';
    if (!expectedSecret || providedSecret !== expectedSecret) {
      throw new ForbiddenException('Unauthorized internal gateway event call');
    }

    this.gateway.emitTeamEvent(payload.event, payload.teamId, payload.data ?? {});
    return { ok: true };
  }
}
