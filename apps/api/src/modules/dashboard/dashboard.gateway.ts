import {
  ConnectedSocket,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';
import { apiConfig } from '../../config/api.config';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUserPayload } from '../auth/auth.service';

@WebSocketGateway({
  namespace: '/dashboard',
  cors: { origin: true, credentials: true },
})
export class DashboardGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(DashboardGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    const token = this.readToken(client);

    if (!token) {
      client.disconnect(true);
      return;
    }

    try {
      const payload = this.jwtService.verify<AuthUserPayload>(token, {
        secret: apiConfig.jwtAccessSecret,
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.id },
        select: {
          id: true,
          organizationId: true,
          status: true,
        },
      });

      if (!user || user.status !== 'ACTIVE') {
        client.disconnect(true);
        return;
      }

      client.data.userId = user.id;
      client.data.organizationId = user.organizationId;
      client.join(`organization:${user.organizationId}`);
      client.join(`user:${user.id}`);

      client.emit('dashboard.connected', {
        organizationId: user.organizationId,
        at: new Date().toISOString(),
      });
    } catch {
      this.logger.warn(`Dashboard socket auth failed for ${client.id}`);
      client.disconnect(true);
    }
  }

  @SubscribeMessage('dashboard.ping')
  ping(@ConnectedSocket() client: Socket) {
    return {
      ok: true,
      at: new Date().toISOString(),
      organizationId: client.data.organizationId as string | undefined,
    };
  }

  emitOrganizationEvent(organizationId: string, event: string, payload: unknown) {
    this.server.to(`organization:${organizationId}`).emit(event, payload);
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
