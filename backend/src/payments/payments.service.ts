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
    provider: 'PAYSTACK' | 'FLUTTERWAVE' | 'AUTO' = 'AUTO',
    callbackUrl?: string,
  ) {
    let chosenProvider: 'PAYSTACK' | 'FLUTTERWAVE' = 'PAYSTACK';

    if (provider === 'AUTO' || !provider) {
      try {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          include: { jobSeekerProfile: true, employer: true },
        });
        const country = (
          user?.jobSeekerProfile?.residenceCountry ||
          user?.employer?.locationCountry ||
          ''
        ).toLowerCase();
        const isNigeria = country.includes('nigeria') || country.includes('ng') || (email || '').toLowerCase().endsWith('.ng');
        if (isNigeria) {
          chosenProvider = 'PAYSTACK';
        } else if (country.length > 0 && !country.includes('nigeria')) {
          chosenProvider = 'FLUTTERWAVE';
        } else {
          chosenProvider = 'PAYSTACK';
        }
      } catch (e) {
        chosenProvider = 'PAYSTACK';
      }
    } else {
      chosenProvider = provider;
    }

    try {
      return await this.initSingleProvider(userId, amount, plan, email, chosenProvider, callbackUrl);
    } catch (primaryError) {
      console.warn(`Primary payment provider ${chosenProvider} failed, falling back to alternate gateway:`, primaryError);
      const fallbackProvider: 'PAYSTACK' | 'FLUTTERWAVE' = chosenProvider === 'PAYSTACK' ? 'FLUTTERWAVE' : 'PAYSTACK';
      try {
        return await this.initSingleProvider(userId, amount, plan, email, fallbackProvider, callbackUrl);
      } catch (fallbackError) {
        throw new InternalServerErrorException('Payment gateway temporarily unavailable. Please try again.');
      }
    }
  }

  private async initSingleProvider(
    userId: string,
    amount: number,
    plan: string,
    email: string,
    provider: 'PAYSTACK' | 'FLUTTERWAVE',
    callbackUrl?: string,
  ) {
    const reference = `JOBHUB_${provider}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;

    if (provider === 'FLUTTERWAVE') {
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
    }

    // Paystack: converts USD amount to NGN kobo for live Nigerian account
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
