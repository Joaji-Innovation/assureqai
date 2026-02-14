/**
 * Payment Controller - Client-facing payment endpoints
 */
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
  RawBodyRequest,
  Headers,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { RequirePermissions, CurrentUser, Public } from '@assureqai/auth';
import { PERMISSIONS, JwtPayload } from '@assureqai/common';

// Client-facing payment endpoints
@ApiTags('Payments')
@ApiBearerAuth()
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) { }

  @Post('create-checkout')
  @ApiOperation({ summary: 'Create a checkout session for credit purchase' })
  async createCheckout(
    @Body()
    dto: {
      planId?: string;
      returnUrl: string;
    },
    @CurrentUser() user: JwtPayload,
  ) {
    if (!user.organizationId) {
      return {
        error: 'No organization linked to your account',
        message: 'Please contact support to set up your organization.',
      };
    }
    return this.paymentService.createCheckoutSession(
      user.organizationId,
      user.sub,
      dto,
    );
  }

  @Get('history')
  @ApiOperation({ summary: 'Get payment history for current organization' })
  async getHistory(
    @CurrentUser() user: JwtPayload,
    @Query('limit') limit?: number,
    @Query('skip') skip?: number,
    @Query('status') status?: string,
  ) {
    if (!user.organizationId) {
      return { payments: [], total: 0 };
    }
    return this.paymentService.getPaymentHistory(user.organizationId, {
      limit: limit || 20,
      skip: skip || 0,
      status,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment details' })
  async getPayment(@Param('id') id: string) {
    return this.paymentService.getPaymentById(id);
  }
}

// Admin payment endpoints
@ApiTags('Admin - Payments')
@ApiBearerAuth()
@Controller('admin/payments')
export class PaymentAdminController {
  constructor(private readonly paymentService: PaymentService) { }

  @Get()
  @RequirePermissions(PERMISSIONS.VIEW_ALL_USAGE)
  @ApiOperation({ summary: 'Get all payments (admin)' })
  async getAllPayments(
    @Query('limit') limit?: number,
    @Query('skip') skip?: number,
    @Query('status') status?: string,
    @Query('organizationId') organizationId?: string,
  ) {
    return this.paymentService.getAllPayments({
      limit: limit || 20,
      skip: skip || 0,
      status,
      organizationId,
    });
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.VIEW_ALL_USAGE)
  @ApiOperation({ summary: 'Get payment details (admin)' })
  async getPayment(@Param('id') id: string) {
    return this.paymentService.getPaymentById(id);
  }

  @Post(':id/complete')
  @RequirePermissions(PERMISSIONS.MANAGE_CREDITS)
  @ApiOperation({ summary: 'Manually complete a payment (admin/testing)' })
  async manualComplete(@Param('id') id: string) {
    return this.paymentService.manualComplete(id);
  }
}

// Webhook controller for Dodo Payments callbacks
@Controller('webhooks')
export class WebhookController {
  constructor(private readonly paymentService: PaymentService) { }

  @Post('dodo')
  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: 'Dodo Payments webhook handler' })
  async handleDodoWebhook(
    @Body() body: any,
    @Headers('x-webhook-signature') signature: string,
    @Headers('dodo-signature') dodoSignature: string,
  ) {
    const sig = signature || dodoSignature;

    // Verify webhook signature
    if (sig) {
      const isValid = this.paymentService.verifyWebhookSignature(
        JSON.stringify(body),
        sig,
      );
      if (!isValid) {
        return { error: 'Invalid signature' };
      }
    }

    await this.paymentService.handleWebhook(body);
    return { received: true };
  }
}
