/**
 * Public Instance Controller - Public endpoints for the running instance
 */
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Public } from '@assureqai/auth';
import { UsageReporterService } from '../audit-report/usage-reporter.service';
import { Post, Req, InternalServerErrorException } from '@nestjs/common';

@ApiTags('Instance - Public')
@Controller('instance')
export class PublicInstanceController {
  constructor(
    private configService: ConfigService,
    private usageReporter: UsageReporterService,
  ) {}

  @Get('status')
  @Public()
  @ApiOperation({ summary: 'Get instance public status (reporting enabled?)' })
  getStatus() {
    const adminPanelUrl = this.configService.get<string>('ADMIN_PANEL_URL');
    const apiKey = this.configService.get<string>('INSTANCE_API_KEY');

    // Do NOT return secrets. Only boolean flags.
    return {
      usageReportingEnabled: !!(adminPanelUrl && apiKey),
      hasAdminUrl: !!adminPanelUrl,
      hasInstanceApiKey: !!apiKey,
    };
  }

  /**
   * Trigger a server-side test report to the admin panel.
   * Protected by normal auth (no @Public) so only logged-in users can trigger it.
   */
  @Post('test-report')
  @ApiOperation({
    summary: 'Send a test usage report to the admin panel (server-side)',
  })
  async sendTestReport(@Req() req: any) {
    if (!this.usageReporter.isReportingEnabled()) {
      return {
        success: false,
        message:
          'Usage reporter not enabled (ADMIN_PANEL_URL or INSTANCE_API_KEY missing)',
      };
    }

    const payload = {
      auditId: `test-${Date.now()}`,
      auditType: 'manual' as const,
      overallScore: 100,
      totalTokens: 0,
      processingDurationMs: 0,
      agentName: req.user?.username || 'test-user',
      metadata: { test: true },
    } as const;

    try {
      await this.usageReporter.reportAudit(payload);
      return { success: true, message: 'Test report sent' };
    } catch (error) {
      throw new InternalServerErrorException('Failed to send test report');
    }
  }
}
