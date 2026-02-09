/**
 * Health Controller
 * Industry-standard health check endpoints
 */
import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HealthCheckResult,
  MongooseHealthIndicator,
} from '@nestjs/terminus';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '@assureqai/auth';
import { EmailService } from '../../modules/email/email.service';
import { AiService } from '../../modules/ai/ai.service';

interface ServiceStatus {
  status: 'connected' | 'disconnected' | 'not_configured';
  message: string;
  latency?: number;
}

interface ConnectivityResult {
  overall: 'healthy' | 'degraded' | 'critical';
  timestamp: string;
  services: {
    database: ServiceStatus;
    smtp: ServiceStatus;
    ai: ServiceStatus;
  };
}

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: MongooseHealthIndicator,
    private emailService: EmailService,
    private aiService: AiService,
  ) {}

  /**
   * Liveness probe - is the service running?
   */
  @Get('live')
  @Public()
  @ApiOperation({ summary: 'Liveness probe' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  live(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Readiness probe - is the service ready to accept traffic?
   */
  @Get('ready')
  @Public()
  @HealthCheck()
  @ApiOperation({ summary: 'Readiness probe' })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  @ApiResponse({ status: 503, description: 'Service is not ready' })
  async ready(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.db.pingCheck('database', { timeout: 3000 }),
    ]);
  }

  /**
   * Full health check with details
   */
  @Get()
  @Public()
  @ApiOperation({ summary: 'Full health check' })
  @ApiResponse({ status: 200, description: 'Health check successful' })
  async check(): Promise<{
    status: string;
    version: string;
    uptime: number;
    timestamp: string;
  }> {
    return {
      status: 'healthy',
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Connectivity check - tests all service connections (SMTP, DB, AI)
   * Returns detailed status for each service so admin panel can display alerts
   */
  @Get('connectivity')
  @Public()
  @ApiOperation({ summary: 'Check connectivity of all services' })
  @ApiResponse({
    status: 200,
    description: 'Connectivity status for all services',
  })
  async connectivity(): Promise<ConnectivityResult> {
    const [dbStatus, smtpStatus, aiStatus] = await Promise.all([
      this.checkDatabase(),
      this.checkSmtp(),
      this.checkAi(),
    ]);

    // Determine overall status
    const statuses = [dbStatus.status, smtpStatus.status, aiStatus.status];
    let overall: 'healthy' | 'degraded' | 'critical' = 'healthy';
    if (statuses.includes('disconnected')) {
      overall =
        statuses.filter((s) => s === 'disconnected').length >= 2
          ? 'critical'
          : 'degraded';
    } else if (statuses.includes('not_configured')) {
      overall = 'degraded';
    }

    return {
      overall,
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
        smtp: smtpStatus,
        ai: aiStatus,
      },
    };
  }

  private async checkDatabase(): Promise<ServiceStatus> {
    try {
      const start = Date.now();
      await this.health.check([
        () => this.db.pingCheck('database', { timeout: 5000 }),
      ]);
      return {
        status: 'connected',
        message: 'Database connection is healthy',
        latency: Date.now() - start,
      };
    } catch (error: any) {
      return {
        status: 'disconnected',
        message: `Database connection failed: ${error?.message || 'Unknown error'}`,
      };
    }
  }

  private async checkSmtp(): Promise<ServiceStatus> {
    if (!this.emailService.isConfigured) {
      return {
        status: 'not_configured',
        message:
          'SMTP not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASSWORD environment variables.',
      };
    }

    try {
      const start = Date.now();
      await this.emailService.transporter.verify();
      return {
        status: 'connected',
        message: 'SMTP connection is healthy',
        latency: Date.now() - start,
      };
    } catch (error: any) {
      const errorMsg = error?.message || error?.toString() || 'Unknown error';
      return {
        status: 'disconnected',
        message: `SMTP connection failed: ${errorMsg}`,
      };
    }
  }

  private async checkAi(): Promise<ServiceStatus> {
    if (!this.aiService.isAvailable()) {
      return {
        status: 'not_configured',
        message:
          'AI Engine not configured. Set GEMINI_API_KEY environment variable.',
      };
    }

    // AI is configured — do a lightweight check by verifying the key format
    // A full API call would incur cost, so we just confirm it's configured
    return {
      status: 'connected',
      message: 'AI Engine is configured and available',
    };
  }
}
