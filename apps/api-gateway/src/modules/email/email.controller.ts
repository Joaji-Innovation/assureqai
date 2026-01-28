/**
 * Email Controller
 */
import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EmailService } from './email.service';
import { RequirePermissions } from '@assureqai/auth';
import { PERMISSIONS } from '@assureqai/common';

@ApiTags('Email')
@ApiBearerAuth()
@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('send')
  @RequirePermissions(PERMISSIONS.MANAGE_SETTINGS)
  @ApiOperation({ summary: 'Send email notification' })
  async sendEmail(@Body() dto: { to: string; subject: string; html: string }) {
    return this.emailService.sendEmail(dto.to, dto.subject, dto.html);
  }

  @Post('test')
  @RequirePermissions(PERMISSIONS.MANAGE_SETTINGS)
  @ApiOperation({ summary: 'Send test email' })
  async sendTestEmail(@Body() dto: { to: string }) {
    return this.emailService.sendTestEmail(dto.to);
  }
}
