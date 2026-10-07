import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async initializePayment(userId: string, amount: number, plan: string, email: string) {
    try {
      const response = await axios.post(
        'https://api.paystack.co/transaction/initialize',
        {
          email,
          amount: amount * 100, // Paystack uses kobo
          metadata: { userId, plan },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const { authorization_url, reference } = response.data.data;

      await this.prisma.payment.create({
        data: {
          userId,
          reference,
          amount,
          plan,
          status: 'PENDING',
        },
      });

      return { authorization_url };
    } catch (e) {
      console.error(e);
      throw new InternalServerErrorException('Failed to initialize payment');
    }
  }

  async verifyPayment(reference: string) {
    try {
      const response = await axios.get(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          },
        },
      );

      const data = response.data.data;
      if (data.status === 'success') {
        const payment = await this.prisma.payment.update({
          where: { reference },
          data: { status: 'SUCCESS' },
        });

        // Upgrade user subscription tier
        await this.prisma.user.update({
          where: { id: payment.userId },
          data: { subscriptionTier: payment.plan === 'PREMIUM_EMPLOYER' ? 'PREMIUM' : 'FREE' },
        });

        return { success: true };
      }
      return { success: false };
    } catch (e) {
      console.error(e);
      throw new InternalServerErrorException('Verification failed');
    }
  }
}
