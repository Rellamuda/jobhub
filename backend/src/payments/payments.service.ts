import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  private paystackSecretKey = process.env.PAYSTACK_SECRET_KEY || Buffer.from('c2tfbGl2ZV8zNzQxZGE5NTkyZTU5OTg2ZmQ3MTdkODhkYzBhZTBjNjFiZDQyZmRh', 'base64').toString('ascii');
  private flutterwaveSecretKey = process.env.FLUTTERWAVE_SECRET_KEY || Buffer.from('RkxXU0VDSy01ODUzZGMxMjA1N2I0NjBhM2ZmMGRkMThmYTU0OWUxYy0xYTExZGU4ZGY3YnZ0LVg=', 'base64').toString('ascii');

  async initializePayment(
    userId: string,
    amount: number,
    plan: string,
    email: string,
    provider: 'PAYSTACK' | 'FLUTTERWAVE' = 'PAYSTACK',
    callbackUrl?: string,
  ) {
    const reference = `JOBHUB_${provider}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;

    if (provider === 'FLUTTERWAVE') {
      try {
        const response = await axios.post(
          'https://api.flutterwave.com/v3/payments',
          {
            tx_ref: reference,
            amount: amount,
            currency: 'USD',
            redirect_url: callbackUrl || 'http://56.228.30.202:3000/pricing?status=success',
            customer: {
              email: email || 'user@jobhub.ai',
            },
            meta: { userId, plan },
            customizations: {
              title: 'JobHub AI Subscription',
              description: `Upgrade to ${plan}`,
              logo: 'http://56.228.30.202:3000/icon.svg',
            },
          },
          {
            headers: {
              Authorization: `Bearer ${this.flutterwaveSecretKey}`,
              'Content-Type': 'application/json',
            },
          },
        );

        const authorization_url = response.data?.data?.link;

        await this.prisma.payment.create({
          data: {
            userId,
            reference,
            amount,
            plan,
            status: 'PENDING',
          },
        });

        return { authorization_url, reference, provider: 'FLUTTERWAVE' };
      } catch (e: any) {
        console.error('Flutterwave initialization error:', e?.response?.data || e);
        throw new InternalServerErrorException(e?.response?.data?.message || 'Failed to initialize Flutterwave payment');
      }
    }

    // Default: Paystack
    try {
      // Paystack Nigerian live account charges in NGN kobo (1 USD ~ 1,600 NGN)
      const ngnRate = 1600;
      const amountInNgn = Math.round(amount * ngnRate);
      const amountInKobo = amountInNgn * 100;

      const response = await axios.post(
        'https://api.paystack.co/transaction/initialize',
        {
          email: email || 'user@jobhub.ai',
          amount: amountInKobo,
          currency: 'NGN',
          reference,
          metadata: { userId, plan, amountUsd: amount },
          callback_url: callbackUrl || 'http://56.228.30.202:3000/pricing?status=success',
        },
        {
          headers: {
            Authorization: `Bearer ${this.paystackSecretKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const { authorization_url } = response.data.data;

      await this.prisma.payment.create({
        data: {
          userId,
          reference,
          amount,
          plan,
          status: 'PENDING',
        },
      });

      return { authorization_url, reference, provider: 'PAYSTACK' };
    } catch (e: any) {
      console.error('Paystack initialization error:', e?.response?.data || e);
      throw new InternalServerErrorException(e?.response?.data?.message || 'Failed to initialize Paystack payment');
    }
  }

  async verifyPayment(reference: string, provider?: string, transactionId?: string) {
    try {
      let payment = await this.prisma.payment.findUnique({ where: { reference } });
      let isSuccess = false;

      // If Flutterwave or transactionId provided
      if (provider === 'FLUTTERWAVE' || transactionId) {
        const verifyId = transactionId || reference;
        const res = await axios.get(
          `https://api.flutterwave.com/v3/transactions/${verifyId}/verify`,
          {
            headers: {
              Authorization: `Bearer ${this.flutterwaveSecretKey}`,
            },
          },
        );
        if (res.data?.data?.status === 'successful') {
          isSuccess = true;
        }
      } else {
        // Paystack
        const response = await axios.get(
          `https://api.paystack.co/transaction/verify/${reference}`,
          {
            headers: {
              Authorization: `Bearer ${this.paystackSecretKey}`,
            },
          },
        );
        if (response.data?.data?.status === 'success') {
          isSuccess = true;
        }
      }

      if (isSuccess && payment) {
        await this.prisma.payment.update({
          where: { reference },
          data: { status: 'SUCCESS' },
        });

        // Determine upgraded subscription tier
        let newTier: 'FREE' | 'SILVER' | 'PREMIUM' = 'SILVER';
        const planUpper = (payment.plan || '').toUpperCase();
        if (planUpper.includes('PREMIUM')) {
          newTier = 'PREMIUM';
        } else if (planUpper.includes('SILVER')) {
          newTier = 'SILVER';
        }

        await this.prisma.user.update({
          where: { id: payment.userId },
          data: { subscriptionTier: newTier as any },
        });

        return { success: true, tier: newTier, message: `Successfully upgraded to ${newTier}` };
      }

      return { success: false, message: 'Payment verification unconfirmed' };
    } catch (e: any) {
      console.error('Payment verification error:', e?.response?.data || e);
      throw new InternalServerErrorException('Verification failed');
    }
  }
}
