import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByUsername(username: string) {
    return this.prisma.user.findUnique({ where: { username } });
  }

  async create(username: string, hashedPassword: string) {
    return this.prisma.user.create({
      data: { username, password: hashedPassword },
      select: { id: true, username: true, createdAt: true },
    });
  }
}
