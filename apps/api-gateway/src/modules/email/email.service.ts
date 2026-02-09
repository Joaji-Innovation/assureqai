/**
 * Email Service - SMTP email sending with nodemailer
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private isConfigured: boolean = false;

  constructor(private configService: ConfigService) {
    const smtpPassword = this.configService.get('SMTP_PASSWORD', '');

    if (!smtpPassword) {
      this.logger.warn('SMTP_PASSWORD not configured - email sending will be disabled');
      this.isConfigured = false;
    } else {
      this.transporter = nodemailer.createTransport({
        host: this.configService.get('SMTP_HOST', 'smtp.sendgrid.net'),
        port: this.configService.get('SMTP_PORT', 587),
        secure: this.configService.get<number>('SMTP_PORT', 587) === 465,
        auth: {
          user: this.configService.get('SMTP_USER', 'apikey'),
          pass: smtpPassword,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
      });
      this.isConfigured = true;
      this.logger.log(`Email service configured with host: ${this.configService.get('SMTP_HOST', 'smtp.sendgrid.net')}`);
    }
  }

  async sendEmail(to: string, subject: string, html: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.isConfigured) {
      this.logger.warn('Email not sent - SMTP not configured');
      return { success: false, error: 'SMTP not configured' };
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.configService.get('SMTP_FROM', 'noreply@assureqai.com'),
        to,
        subject,
        html,
      });

      this.logger.log(`Email sent to ${to}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error: any) {
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      this.logger.error(`Failed to send email to ${to}: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  async sendTestEmail(to: string): Promise<{ success: boolean; message: string }> {
    if (!this.isConfigured) {
      return {
        success: false,
        message: 'SMTP not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASSWORD environment variables.',
      };
    }

    try {
      // Verify SMTP connection first
      await this.transporter.verify();
    } catch (verifyError: any) {
      const errorMsg = verifyError?.message || verifyError?.toString() || 'Unknown error';
      this.logger.error(`SMTP connection verification failed: ${errorMsg}`);
      return {
        success: false,
        message: `SMTP connection failed: ${errorMsg}. Check your SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASSWORD settings.`,
      };
    }

    const result = await this.sendEmail(
      to,
      'AssureQai - Test Email',
      '<h1>Test Email</h1><p>This is a test email from AssureQai. Your email configuration is working correctly.</p>'
    );
    return {
      success: result.success,
      message: result.success
        ? 'Test email sent successfully'
        : `Failed to send test email: ${result.error}`,
    };
  }

  async sendAuditNotification(to: string, auditData: any): Promise<void> {
    await this.sendEmail(
      to,
      `Audit Complete - Score: ${auditData.overallScore}%`,
      `
        <h2>Audit Notification</h2>
        <p>Agent: ${auditData.agentName}</p>
        <p>Score: ${auditData.overallScore}%</p>
        <p>Date: ${new Date().toLocaleString()}</p>
      `
    );
  }
}
