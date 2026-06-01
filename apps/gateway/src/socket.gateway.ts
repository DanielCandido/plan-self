import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';

interface JwtClaims {
  id: string;
  organizationId: string;
  email?: string;
}

@WebSocketGateway({
  namespace: '/events',
  cors: { origin: true, credentials: true },
})
export class GatewayServer implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(GatewayServer.name);
  private readonly jwtSecret = process.env.JWT_ACCESS_SECRET ?? '';
  private readonly apiBaseUrl = process.env.API_BASE_URL ?? 'http://localhost:3001';

  handleConnection(client: Socket) {
    const claims = this.verifyToken(client);
    if (!claims) {
      client.disconnect(true);
      return;
    }

    client.data.userId = claims.id;
    client.data.organizationId = claims.organizationId;
    client.emit('connected', { at: new Date().toISOString(), organizationId: claims.organizationId });
  }

  @SubscribeMessage('task:subscribe')
  subscribeTask(@ConnectedSocket() client: Socket, @MessageBody() payload: { taskId: string }) {
    client.join(`task:${payload.taskId}`);
    return { ok: true, room: `task:${payload.taskId}` };
  }

  @SubscribeMessage('team:subscribe')
  subscribeTeam(@ConnectedSocket() client: Socket, @MessageBody() payload: { teamId: string }) {
    client.join(`team:${payload.teamId}`);
    return { ok: true, room: `team:${payload.teamId}` };
  }

  @SubscribeMessage('project:subscribe')
  subscribeProject(@ConnectedSocket() client: Socket, @MessageBody() payload: { projectId: string }) {
    const room = `project:${payload.projectId}`;
    client.join(room);
    return { ok: true, room };
  }

  @SubscribeMessage('project:unsubscribe')
  unsubscribeProject(@ConnectedSocket() client: Socket, @MessageBody() payload: { projectId: string }) {
    const room = `project:${payload.projectId}`;
    client.leave(room);
    return { ok: true, room };
  }

  @SubscribeMessage('kanban:sync.request')
  async syncKanban(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { projectId: string },
  ) {
    const token = this.readToken(client);
    if (!token) {
      return { ok: false, error: 'Unauthorized' };
    }

    try {
      const url = `${this.apiBaseUrl}/boards/${payload.projectId}`;
      const response = await fetch(url, {
        headers: {
          Authorization: 'Bearer ' + token,
        },
      });

      if (!response.ok) {
        return { ok: false, error: `API responded with ${response.status}` };
      }

      const board = await response.json() as Record<string, unknown>;
      client.emit('kanban.snapshot', {
        projectId: payload.projectId,
        timestamp: new Date().toISOString(),
        board,
      });
      return { ok: true };
    } catch (error) {
      this.logger.warn(`Failed to fetch kanban snapshot for project ${payload.projectId}: ${String(error)}`);
      return { ok: false, error: 'Failed to fetch snapshot' };
    }
  }

  emitTeamEvent(event: string, teamId: string, data: Record<string, unknown>) {
    this.server.to(`team:${teamId}`).emit(event, data);
  }

  emitProjectEvent(event: string, projectId: string, data: Record<string, unknown>) {
    this.server.to(`project:${projectId}`).emit(event, data);
  }

  private verifyToken(client: Socket): JwtClaims | null {
    const token = this.readToken(client);
    if (!token || !this.jwtSecret) return null;

    try {
      return jwt.verify(token, this.jwtSecret) as JwtClaims;
    } catch {
      this.logger.warn(`Socket auth failed for ${client.id}`);
      return null;
    }
  }

  private readToken(client: Socket): string | undefined {
    const authToken = client.handshake.auth?.token;
    if (typeof authToken === 'string' && authToken.length > 0) {
      return authToken;
    }

    const header = client.handshake.headers.authorization;
    if (typeof header === 'string' && header.startsWith('Bearer ')) {
      return header.slice(7);
    }

    return undefined;
  }
}
