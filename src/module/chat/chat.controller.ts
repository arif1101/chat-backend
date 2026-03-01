import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
// @UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Get('rooms')
  getRooms() {
    return this.chatService.getRooms();
  }

  @Post('rooms')
  createRoom(@Body() body: { name: string }) {
    return this.chatService.createRoom(body.name);
  }

  @Get('rooms/:id/messages')
  getMessages(@Param('id') roomId: string) {
    return this.chatService.getMessages(roomId);
  }
}
