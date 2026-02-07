/**
 * Contact Controller - Public endpoint for contact form
 */
import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ContactService } from './contact.service';

import { Public } from '@assureqai/auth';

@ApiTags('Contact')
@Public()
@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) { }

  @Post()
  @ApiOperation({ summary: 'Submit contact form' })
  async submitContact(
    @Body() dto: { name: string; email: string; company?: string; message: string },
  ) {
    return this.contactService.submitContact(dto);
  }

  @Post('demo')
  @ApiOperation({ summary: 'Request demo' })
  async requestDemo(
    @Body() dto: { name: string; email: string; company: string; phone?: string; message?: string },
  ) {
    return this.contactService.requestDemo(dto);
  }
}
