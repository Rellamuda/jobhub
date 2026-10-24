import { Controller, Post, Get, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('initialize')
  @UseGuards(JwtAuthGuard)
  async initialize(@Request() req, @Body() body: { amount: number; plan: string; email: string; provider?: 'PAYSTACK' | 'FLUTTERWAVE' | 'AUTO'; callbackUrl?: string }) {
    return this.paymentsService.initializePayment(req.user.userId, body.amount, body.plan, body.email, body.provider, body.callbackUrl);
  }

  @Get('verify/:reference')
  async verify(
    @Param('reference') reference: string,
    @Query('provider') provider?: string,
    @Query('transaction_id') txId?: string,
  ) {
    return this.paymentsService.verifyPayment(reference, provider, txId);
  }

  @Post('mobile-upgrade')
  @UseGuards(JwtAuthGuard)
  async mobileUpgrade(@Request() req, @Body() body: { tier: 'FREE' | 'SILVER' | 'PREMIUM'; platform?: string }) {
    return this.paymentsService.upgradeMobileUser(req.user.userId, body.tier, body.platform);
  }

  @Post('revenuecat-webhook')
  async revenueCatWebhook(@Body() body: any) {
    return this.paymentsService.handleRevenueCatWebhook(body);
  }
}
