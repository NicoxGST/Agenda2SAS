import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';

import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('checkout')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CLIENT)
  createCheckout(@Request() req: any, @Body() dto: CreateCheckoutDto) {
    return this.paymentsService.createCheckout(req.user.id, dto);
  }

  @Post('webhook')
  webhook(@Body() body: any, @Query() query: any) {
    return this.paymentsService.handleWebhook(body, query);
  }

  @Get('verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CLIENT)
  verifyPayment(
    @Query('paymentId') paymentId?: string,
    @Query('ref') ref?: string,
  ) {
    if (ref) return this.paymentsService.verifyByRef(ref);
    return this.paymentsService.verifyPayment(paymentId!);
  }
}
