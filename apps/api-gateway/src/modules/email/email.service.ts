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

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST', 'smtp.sendgrid.net'),
      port: this.configService.get('SMTP_PORT', 587),
      secure: false,
      auth: {
        user: this.configService.get('SMTP_USER', 'apikey'),
        pass: this.configService.get('SMTP_PASSWORD', ''),
      },
    });
  }

  async sendEmail(to: string, subject: string, html: string): Promise<{ success: boolean; messageId?: string }> {
    try {
      const info = await this.transporter.sendMail({
        from: this.configService.get('SMTP_FROM', 'noreply@assureqai.com'),
        to,
        subject,
        html,
      });

      this.logger.log(`Email sent: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      this.logger.error('Failed to send email:', error);
      return { success: false };
    }
  }

  async sendTestEmail(to: string): Promise<{ success: boolean; message: string }> {
    const result = await this.sendEmail(
      to,
      'AssureQai - Test Email',
      '<h1>Test Email</h1><p>This is a test email from AssureQai.</p>'
    );
    return {
      success: result.success,
      message: result.success ? 'Test email sent successfully' : 'Failed to send test email',
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
