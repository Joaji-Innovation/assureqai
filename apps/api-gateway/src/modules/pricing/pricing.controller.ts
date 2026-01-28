import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Pricing')
@Controller('pricing')
export class PricingController {
  @Get()
  @ApiOperation({ summary: 'Get current pricing configuration' })
  @ApiResponse({ status: 200, description: 'Pricing configuration' })
  getPricing() {
    return {
      currency: {
        symbol: '$',
        code: 'USD',
      },
      perAudit: 0.50,
      subscription: {
        starter: 199,
        pro: 499,
        enterprise: 999
      },
      plans: [
        {
          id: 'starter',
          name: 'Starter',
          price: 199,
          features: ['Up to 1,000 audits/mo', 'Basic Analytics', 'Email Support']
        },
        {
          id: 'pro',
          name: 'Professional',
          price: 499,
          features: ['Up to 5,000 audits/mo', 'Advanced Analytics', 'Priority Support', 'API Access']
        },
        {
          id: 'enterprise',
          name: 'Enterprise',
          price: 999,
          features: ['Unlimited audits', 'Custom Analytics', 'Dedicated Manager', 'SLA']
        }
      ]
    };
  }
}
