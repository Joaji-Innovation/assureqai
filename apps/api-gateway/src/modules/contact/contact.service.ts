/**
 * Contact Service
 */
import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from '../email/email.service';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(private readonly emailService: EmailService) { }

  async submitContact(dto: { name: string; email: string; company?: string; message: string }) {
    this.logger.log(`Contact form submission from ${dto.email}`);

    // Send notification email to sales
    await this.emailService.sendEmail(
      'sales@assureqai.com',
      `New Contact: ${dto.name}`,
      `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${dto.name}</p>
        <p><strong>Email:</strong> ${dto.email}</p>
        <p><strong>Company:</strong> ${dto.company || 'N/A'}</p>
        <p><strong>Message:</strong></p>
        <p>${dto.message}</p>
      `
    );

    return { success: true, message: 'Thank you for contacting us. We will respond shortly.' };
  }

  async requestDemo(dto: { name: string; email: string; company: string; phone?: string; message?: string }) {
    this.logger.log(`Demo request from ${dto.email}`);

    await this.emailService.sendEmail(
      'sales@assureqai.com',
      `Demo Request: ${dto.company}`,
      `
        <h2>New Demo Request</h2>
        <p><strong>Name:</strong> ${dto.name}</p>
        <p><strong>Email:</strong> ${dto.email}</p>
        <p><strong>Company:</strong> ${dto.company}</p>
        <p><strong>Phone:</strong> ${dto.phone || 'N/A'}</p>
        <p><strong>Message:</strong> ${dto.message || 'N/A'}</p>
      `
    );

    return { success: true, message: 'Demo request received. Our team will contact you soon.' };
  }
}
