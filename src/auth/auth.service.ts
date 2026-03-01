import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from 'src/module/users/users.service';

import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(username: string, password: string) {
    const existing = await this.userService.findByUsername(username);
    if (existing) throw new ConflictException('Username already taken');

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.userService.create(username, hashedPassword);

    return this.signToken(user.id, user.username);
  }

  async login(username: string, password: string) {
    const user = await this.userService.findByUsername(username);
    if (!user) {
      throw new UnauthorizedException('Invalid Credentials!');
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new UnauthorizedException('Invalid credentials!');

    return this.signToken(user.id, user.username);
  }

  private signToken(userId: string, username: string) {
    const token = this.jwtService.sign({ sub: userId, username });
    return { access_token: token, username, userId };
  }
}
