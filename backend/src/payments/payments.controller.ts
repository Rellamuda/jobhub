import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('initialize')
  @UseGuards(JwtAuthGuard)
  async initialize(@Request() req, @Body() body: { amount: number; plan: string; email: string }) {
    return this.paymentsService.initializePayment(req.user.userId, body.amount, body.plan, body.email);
  }

  @Get('verify/:reference')
  async verify(@Param('reference') reference: string) {
    return this.paymentsService.verifyPayment(reference);
  }
}
