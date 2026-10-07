import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  async sendMessage(@Request() req, @Body() body: { receiverId: string, content: string }) {
    return this.messagesService.sendMessage(req.user.userId, body.receiverId, body.content);
  }

  @Get('inbox')
  async getInbox(@Request() req) {
    return this.messagesService.getInbox(req.user.userId);
  }

  @Get(':userId')
  async getConversation(@Request() req, @Param('userId') otherUserId: string) {
    return this.messagesService.getConversation(req.user.userId, otherUserId);
  }
}
