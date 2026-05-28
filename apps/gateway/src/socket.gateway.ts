import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  namespace: '/events',
  cors: { origin: true, credentials: true },
})
export class GatewayServer implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    client.emit('connected', { at: new Date().toISOString() });
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

  emitTeamEvent(event: string, teamId: string, data: Record<string, unknown>) {
    this.server.to(`team:${teamId}`).emit(event, data);
  }
}
