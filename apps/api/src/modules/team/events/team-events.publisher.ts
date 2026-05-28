import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class TeamEventsPublisher {
  private readonly logger = new Logger(TeamEventsPublisher.name);
  private readonly gatewayUrl = process.env.GATEWAY_URL ?? 'http://localhost:3010';
  private readonly gatewaySecret = process.env.GATEWAY_SECRET ?? process.env.JWT_ACCESS_SECRET ?? '';

  async publish(
    event: string,
    payload: {
      teamId: string;
      data: Record<string, unknown>;
    },
  ) {
    try {
      await fetch(`${this.gatewayUrl}/internal/team-events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gateway-secret': this.gatewaySecret,
        },
        body: JSON.stringify({
          event,
          teamId: payload.teamId,
          data: payload.data,
        }),
      });
    } catch (error) {
      this.logger.warn(`Failed to publish gateway event "${event}": ${String(error)}`);
    }
  }
}
