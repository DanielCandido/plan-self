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
}
