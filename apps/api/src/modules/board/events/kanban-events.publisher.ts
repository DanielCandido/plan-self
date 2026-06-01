import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class KanbanEventsPublisher {
  private readonly logger = new Logger(KanbanEventsPublisher.name);
  private readonly gatewayUrl = process.env.GATEWAY_URL ?? 'http://localhost:3010';
  private readonly gatewaySecret = process.env.GATEWAY_SECRET ?? process.env.JWT_ACCESS_SECRET ?? '';

  async publish(
    event: string,
    payload: {
      projectId: string;
      organizationId: string;
      data: Record<string, unknown>;
    },
  ) {
    try {
      await fetch(`${this.gatewayUrl}/internal/kanban-events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gateway-secret': this.gatewaySecret,
        },
        body: JSON.stringify({
          event,
          projectId: payload.projectId,
          data: {
            ...payload.data,
            organizationId: payload.organizationId,
            timestamp: new Date().toISOString(),
          },
        }),
      });
    } catch (error) {
      this.logger.warn(`Failed to publish kanban gateway event "${event}": ${String(error)}`);
    }
  }
}
