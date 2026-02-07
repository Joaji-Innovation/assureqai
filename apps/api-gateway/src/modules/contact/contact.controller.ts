/**
 * Contact Controller - Public endpoint for contact form
 */
import { Controller, Post, Get, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ContactService } from './contact.service';

import { Public, Roles } from '@assureqai/auth';
import { ROLES } from '@assureqai/common';

@ApiTags('Contact')
@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) { }

  @Public()
  @Post()
  @ApiOperation({ summary: 'Submit contact form' })
  async submitContact(
    @Body() dto: { name: string; email: string; company?: string; message: string },
  ) {
    return this.contactService.submitContact(dto);
  }

  @Public()
  @Post('demo')
  @ApiOperation({ summary: 'Request demo' })
  async requestDemo(
    @Body() dto: { name: string; email: string; company: string; phone?: string; message?: string },
  ) {
    return this.contactService.requestDemo(dto);
  }

  @Get('leads')
  @Roles(ROLES.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all leads (Admin only)' })
  async getLeads() {
    return this.contactService.findAll();
  }
}
