import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async sendMessage(senderId: string, receiverId: string, content: string) {
    if (senderId === receiverId) {
      throw new ForbiddenException('You cannot send a message to yourself.');
    }

    const message = await this.prisma.message.create({
      data: {
        senderId,
        receiverId,
        content,
      },
    });

    try {
      const sender = await this.prisma.user.findUnique({
        where: { id: senderId },
        include: { jobSeekerProfile: true, employer: true },
      });
      const senderName =
        sender?.employer?.companyName ||
        (sender?.jobSeekerProfile
          ? `${sender.jobSeekerProfile.firstName || ''} ${sender.jobSeekerProfile.lastName || ''}`.trim()
          : null) ||
        sender?.email ||
        'A user';
      const snippet = content.length > 80 ? `${content.substring(0, 80)}...` : content;

      await this.prisma.notification.create({
        data: {
          userId: receiverId,
          matchProbability: 100,
          message: `💬 New Message from ${senderName}: "${snippet}"`,
        },
      });
    } catch (err) {
      console.error('Failed to create notification for message:', err);
    }

    return message;
  }

  async getInbox(userId: string) {
    // Find all messages involving the user
    const messages = await this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId },
        ]
      },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          include: { jobSeekerProfile: true, employer: true }
        },
        receiver: {
          include: { jobSeekerProfile: true, employer: true }
        }
      }
    });

    // Group by conversation partner to get latest message per thread
    const inbox: any[] = [];
    const seenUsers = new Set();

    for (const msg of messages) {
      const otherUserId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      if (!seenUsers.has(otherUserId)) {
        seenUsers.add(otherUserId);
        const otherUser = msg.senderId === userId ? msg.receiver : msg.sender;
        inbox.push({
          otherUserId,
          otherUser,
          latestMessage: msg
        });
      }
    }

    return inbox;
  }

  async getConversation(userId: string, otherUserId: string) {
    return this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ]
      },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: { id: true, role: true }
        }
      }
    });
  }
}
