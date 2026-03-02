import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, string>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    const token =
      client.handshake.headers.authorization?.split(' ')[1] ||
      (client.handshake.query.token as string);

    if (!token) {
      console.log(`Connection rejected: No token (Socket: ${client.id})`);
      client.disconnect();
      return;
    }

    try {
      const payload = this.jwtService.verify(token);
      const userId = payload.sub;

      // Buscar usuário para garantir que está ativo
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || !user.isActive) {
        console.log(
          `Connection rejected: User inactive or not found (User: ${userId})`,
        );
        client.disconnect();
        return;
      }

      // Verificar Blacklist
      const isBlacklisted = await this.prisma.blacklistedToken.findUnique({
        where: { token },
      });
      if (isBlacklisted) {
        console.log(`Connection rejected: Token blacklisted (User: ${userId})`);
        client.disconnect();
        return;
      }

      client.data.userId = userId;
      client.join(userId);
      this.connectedUsers.set(userId, client.id);

      console.log(`Socket Connected: ${client.id} (User: ${userId})`);
      client.emit('authenticated', { message: 'Conectado com sucesso' });
    } catch (e) {
      console.log(`Connection rejected: Invalid token (Socket: ${client.id})`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    if (client.data.userId) {
      this.connectedUsers.delete(client.data.userId);
    }
    console.log(`Socket Disconnected: ${client.id}`);
  }

  emitToUser(userId: string, event: string, data: any) {
    this.server.to(userId).emit(event, data);
  }
  forceDisconnect(userId: string) {
    this.server.to(userId).emit('force-logout', {
      message: 'Sua conta foi desativada pelo administrador.',
    });

    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      const socket = this.server.sockets.sockets.get(socketId);
      if (socket) socket.disconnect();
    }
  }
}
