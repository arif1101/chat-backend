import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: { origin: '*' }, // allow all origins for now
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // keep track of who is connected
  private connectedUsers = new Map<
    string,
    { userId: string; username: string }
  >();

  constructor(
    private chatService: ChatService,
    private jwtService: JwtService,
  ) {}

  // ── runs automatically when a client connects ──────────────────────────────
  async handleConnection(client: Socket) {
    try {
      const token = (
        client.handshake.auth?.token ||
        client.handshake.headers?.token ||
        client.handshake.query?.token
      ) // ← reads from URL query param
        ?.replace('Bearer ', '') as string;

      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET ?? 'fallback',
      });

      this.connectedUsers.set(client.id, {
        userId: payload.sub,
        username: payload.username,
      });

      console.log(`✅ Connected: ${payload.username}`);
    } catch (err) {
      console.log(`❌ Invalid token, disconnecting ${client.id}`);
      client.disconnect();
    }
  }

  // ── runs automatically when a client disconnects ───────────────────────────
  handleDisconnect(client: Socket) {
    const user = this.connectedUsers.get(client.id);
    if (user) {
      console.log(`👋 Disconnected: ${user.username}`);
      this.connectedUsers.delete(client.id);
    }
  }

  // ── client emits 'joinRoom' ────────────────────────────────────────────────
  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() roomId: string,
  ) {
    // leave previous rooms
    const rooms = Array.from(client.rooms).filter((r) => r !== client.id);
    rooms.forEach((room) => client.leave(room));

    // join the new room
    client.join(roomId);

    // send last 50 messages to THIS client only
    const messages = await this.chatService.getMessages(roomId);
    client.emit('messageHistory', messages);

    const user = this.connectedUsers.get(client.id);
    console.log(`📦 ${user?.username} joined room ${roomId}`);
  }

  // ── client emits 'sendMessage' ─────────────────────────────────────────────
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { text: string; roomId: string },
  ) {
    const user = this.connectedUsers.get(client.id);
    if (!user) return;
    if (!data.text?.trim() || !data.roomId) return;

    // save to database
    const message = await this.chatService.saveMessage(
      data.text.trim(),
      user.userId,
      data.roomId,
    );

    // broadcast to everyone in the room including sender
    this.server.to(data.roomId).emit('newMessage', message);
  }
}
