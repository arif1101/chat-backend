import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async getRooms() {
    return this.prisma.room.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  async createRoom(name: string) {
    return this.prisma.room.create({ data: { name } });
  }

  async getMessages(roomId: string) {
    return this.prisma.message.findMany({
      where: { roomId },
      orderBy: { createdAT: 'asc' },
      take: 50,
      include: {
        user: {
          select: { id: true, username: true },
        },
      },
    });
  }

  async saveMessage(text: string, userId: string, roomId: string) {
    return this.prisma.message.create({
      data: { text, userId, roomId },
      include: {
        user: {
          select: { id: true, username: true },
        },
      },
    });
  }
}
