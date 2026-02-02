/**
 * Usage Reporter Service
 * Sends audit usage reports to the central admin panel
 * Used by isolated instances to "phone home" with usage data
 */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface AuditReportPayload {
  auditId: string;
  agentName?: string;
  callId?: string;
  campaignName?: string;
  auditType: 'ai' | 'manual' | 'bulk';
  overallScore: number;
  maxPossibleScore?: number;
  audioDurationSeconds?: number;
  processingDurationMs?: number;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  parametersCount?: number;
  sentiment?: { overall: 'positive' | 'neutral' | 'negative' };
  hasFatalErrors?: boolean;
  passStatus?: 'pass' | 'fail';
  metadata?: Record<string, any>;
}

@Injectable()
export class UsageReporterService implements OnModuleInit {
  private readonly logger = new Logger(UsageReporterService.name);
  private adminPanelUrl: string | null = null;
  private apiKey: string | null = null;
  private isEnabled: boolean = false;

  constructor(private configService: ConfigService) { }

  onModuleInit() {
    // Read config for admin panel URL and API key
    this.adminPanelUrl = this.configService.get<string>('ADMIN_PANEL_URL');
    this.apiKey = this.configService.get<string>('INSTANCE_API_KEY');

    // Enable if both are configured
    this.isEnabled = !!(this.adminPanelUrl && this.apiKey);

    if (this.isEnabled) {
      this.logger.log(`Usage reporter enabled, reporting to: ${this.adminPanelUrl}`);
    } else {
      this.logger.log('Usage reporter disabled (ADMIN_PANEL_URL or INSTANCE_API_KEY not set)');
    }
  }

  /**
   * Report an audit to the admin panel
   * This is fire-and-forget - errors are logged but don't affect audit flow
   */
  async reportAudit(payload: AuditReportPayload): Promise<void> {
    if (!this.isEnabled) {
      return; // Silent return if not enabled
    }

    try {
      const response = await fetch(`${this.adminPanelUrl}/api/admin/audit-reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey!,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.warn(`Failed to report audit ${payload.auditId}: ${response.status} - ${error}`);
      } else {
        this.logger.debug(`Reported audit ${payload.auditId} to admin panel`);
      }
    } catch (error: any) {
      // Don't throw - this is non-critical
      this.logger.warn(`Failed to report audit ${payload.auditId}: ${error.message}`);
    }
  }

  /**
   * Check if reporting is enabled
   */
  isReportingEnabled(): boolean {
    return this.isEnabled;
  }
}
